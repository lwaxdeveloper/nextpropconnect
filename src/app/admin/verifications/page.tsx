'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Verification {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_avatar: string;
  type: string;
  status: string;
  property_title: string | null;
  property_address: string | null;
  documents: Array<{ type: string; url: string }>;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  async function fetchVerifications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: number, action: 'approve' | 'reject', reason?: string) {
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (res.ok) {
        setSelectedVerification(null);
        fetchVerifications();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'identity': return '🪪';
      case 'agent': return '🏢';
      case 'property': return '🏠';
      default: return '📄';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Verification Queue</h1>
          <p className="text-muted-foreground">Review and approve user verifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{counts.pending || 0}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold text-green-600">{counts.approved || 0}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{counts.rejected || 0}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">
            {Object.values(counts).reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Verifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : verifications.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No {filter} verifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map(v => (
            <div
              key={v.id}
              className="bg-card border rounded-xl p-4 hover:border-primary transition cursor-pointer"
              onClick={() => setSelectedVerification(v)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getTypeIcon(v.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{v.user_name}</span>
                      <span className="text-sm text-muted-foreground">{v.user_email}</span>
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {v.type} verification
                      {v.property_title && ` • ${v.property_title}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {new Date(v.submitted_at).toLocaleDateString()}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    v.status === 'approved' ? 'bg-green-100 text-green-800' :
                    v.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {v.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedVerification && (
        <ReviewModal
          verification={selectedVerification}
          onClose={() => setSelectedVerification(null)}
          onApprove={() => handleAction(selectedVerification.id, 'approve')}
          onReject={(reason) => handleAction(selectedVerification.id, 'reject', reason)}
        />
      )}
    </div>
  );
}

function ReviewModal({ verification, onClose, onApprove, onReject }: {
  verification: Verification;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const documents = typeof verification.documents === 'string' 
    ? JSON.parse(verification.documents) 
    : verification.documents || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Review Verification</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* User Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {verification.user_avatar ? (
                <img src={verification.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>
            <div>
              <div className="font-semibold">{verification.user_name}</div>
              <div className="text-sm text-muted-foreground">{verification.user_email}</div>
            </div>
          </div>
        </div>

        {/* Verification Type */}
        <div className="mb-4">
          <div className="text-sm text-muted-foreground">Type</div>
          <div className="font-medium capitalize">{verification.type} Verification</div>
        </div>

        {/* Property (if applicable) */}
        {verification.property_title && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">Property</div>
            <div className="font-medium">{verification.property_title}</div>
            <div className="text-sm text-muted-foreground">{verification.property_address}</div>
          </div>
        )}

        {/* Documents */}
        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-2">Documents ({documents.length})</div>
          <div className="grid grid-cols-2 gap-4">
            {documents.map((doc: { type: string; url: string }, i: number) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <img 
                  src={doc.url} 
                  alt={doc.type} 
                  className="w-full h-40 object-cover cursor-pointer"
                  onClick={() => window.open(doc.url, '_blank')}
                />
                <div className="p-2 text-sm text-center bg-muted capitalize">
                  {doc.type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {verification.status === 'pending' && !showRejectForm && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowRejectForm(true)}
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Approve ✓
            </button>
          </div>
        )}

        {showRejectForm && (
          <div className="space-y-3">
            <textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border rounded-lg"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectForm(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => onReject(rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {verification.status !== 'pending' && (
          <div className={`p-4 rounded-lg ${
            verification.status === 'approved' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="font-medium capitalize">{verification.status}</div>
            {verification.rejection_reason && (
              <div className="text-sm mt-1">{verification.rejection_reason}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
