'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MaintenanceRequest {
  id: number;
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  property_title: string;
  property_address: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  images: string[];
  landlord_notes: string;
  created_at: string;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function fetchRequests() {
    try {
      let url = '/api/maintenance';
      if (filter !== 'all') url += `?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string, notes?: string) {
    await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, landlord_notes: notes }),
    });
    fetchRequests();
    setSelectedRequest(null);
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Count by status
  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Maintenance Requests</h1>
        <p className="text-muted-foreground">Handle tenant repair and maintenance requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">New</div>
          <div className="text-2xl font-bold text-blue-600">{counts.new || 0}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">In Progress</div>
          <div className="text-2xl font-bold text-purple-600">{counts.in_progress || 0}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-green-600">{counts.completed || 0}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{requests.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'new', 'acknowledged', 'in_progress', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <svg className="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold mb-2">No maintenance requests</h3>
          <p className="text-muted-foreground">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div
              key={request.id}
              className="bg-card border rounded-xl p-4 hover:border-primary transition cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{request.tenant_name}</span>
                    <span className="mx-2">•</span>
                    <span>{request.property_title}</span>
                  </div>
                  {request.description && (
                    <p className="text-sm mt-2 line-clamp-2">{request.description}</p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}

function RequestModal({ request, onClose, onUpdateStatus }: {
  request: MaintenanceRequest;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string, notes?: string) => void;
}) {
  const [notes, setNotes] = useState(request.landlord_notes || '');
  const [status, setStatus] = useState(request.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{request.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Tenant</div>
            <div>{request.tenant_name} — {request.tenant_email}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Property</div>
            <div>{request.property_title}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Category</div>
            <div className="capitalize">{request.category || 'General'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Description</div>
            <div>{request.description || 'No description provided'}</div>
          </div>

          {request.images?.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Photos</div>
              <div className="flex gap-2 flex-wrap">
                {request.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded" />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="new">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="Add notes for tracking..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => onUpdateStatus(request.id, status, notes)}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
