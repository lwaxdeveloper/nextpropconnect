'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FeedbackItem {
  id: number;
  type: 'bug' | 'feature' | 'other';
  message: string;
  email: string | null;
  page_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  async function fetchFeedback() {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        let data = await res.json();
        if (filter !== 'all') {
          data = data.filter((f: FeedbackItem) => f.type === filter);
        }
        setFeedback(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchFeedback();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const typeColors = {
    bug: 'bg-red-100 text-red-700',
    feature: 'bg-blue-100 text-blue-700',
    other: 'bg-gray-100 text-gray-700',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-yellow-100 text-yellow-700',
    reviewed: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    wontfix: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-primary hover:underline text-sm mb-2 inline-block">
              ← Back to Admin
            </Link>
            <h1 className="text-2xl font-bold">User Feedback</h1>
            <p className="text-gray-500">Bugs, feature requests, and suggestions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'bug', 'feature', 'other'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? '📋 All' : f === 'bug' ? '🐛 Bugs' : f === 'feature' ? '💡 Ideas' : '💬 Other'}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                        {item.type === 'bug' ? '🐛 Bug' : item.type === 'feature' ? '💡 Idea' : '💬 Other'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status] || statusColors.new}`}>
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{item.message}</p>
                    {item.email && (
                      <p className="text-sm text-gray-500 mt-2">
                        📧 <a href={`mailto:${item.email}`} className="text-primary hover:underline">{item.email}</a>
                      </p>
                    )}
                    {item.page_url && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        📍 {item.page_url}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className="text-sm border rounded-lg px-3 py-2"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                      <option value="wontfix">Won't Fix</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
