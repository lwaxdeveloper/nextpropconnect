'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Agency {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  email: string;
  phone: string;
  city: string;
  is_verified: boolean;
  subscription_tier: string;
  commission_split: number;
  member_role: string;
  agent_count?: number;
  listing_count?: number;
}

interface Member {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar_url: string;
  role: string;
  status: string;
  listing_count: number;
  identity_verified: boolean;
  agent_verified: boolean;
}

export default function AgencyDashboard() {
  const router = useRouter();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchAgency();
  }, []);

  async function fetchAgency() {
    try {
      const res = await fetch('/api/agencies?mine=true');
      if (res.ok) {
        const data = await res.json();
        if (data.agency) {
          setAgency(data.agency);
          fetchMembers(data.agency.id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers(agencyId: number) {
    try {
      const res = await fetch(`/api/agencies/${agencyId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!agency) return;
    
    setInviting(true);
    try {
      const res = await fetch(`/api/agencies/${agency.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'agent' }),
      });

      if (res.ok) {
        setShowInviteForm(false);
        setInviteEmail('');
        fetchMembers(agency.id);
        alert('Invitation sent!');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setInviting(false);
    }
  }

  const isOwnerOrAdmin = agency?.member_role === 'owner' || agency?.member_role === 'admin';

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h1 className="text-2xl font-bold mb-4">No Agency Yet</h1>
            <p className="text-muted-foreground mb-6">
              Create your agency to manage a team of agents, share listings, and grow your business.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/agency/new"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Create Agency
              </Link>
              <Link
                href="/agency/join"
                className="px-6 py-3 border rounded-lg font-medium hover:bg-muted"
              >
                Join an Agency
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <span className="text-2xl">🏢</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{agency.name}</h1>
              {agency.is_verified && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{agency.city}</p>
          </div>
        </div>
        {isOwnerOrAdmin && (
          <Link
            href="/agency/settings"
            className="px-4 py-2 border rounded-lg hover:bg-muted"
          >
            ⚙️ Settings
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Team Members</div>
          <div className="text-2xl font-bold">{members.length}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Listings</div>
          <div className="text-2xl font-bold">{agency.listing_count || 0}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Commission Split</div>
          <div className="text-2xl font-bold">{agency.commission_split}%</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Plan</div>
          <div className="text-2xl font-bold capitalize">{agency.subscription_tier}</div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Team Members</h2>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              + Invite Agent
            </button>
          )}
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <form onSubmit={handleInvite} className="mb-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="agent@example.com"
                className="flex-1 px-4 py-2 border rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div className="space-y-3">
          {members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    {member.agent_verified && <span className="text-green-500 text-sm">✓</span>}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                      member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{member.listing_count}</div>
                <div className="text-xs text-muted-foreground">listings</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/agent/properties"
          className="bg-card border rounded-xl p-4 hover:border-primary transition"
        >
          <div className="text-2xl mb-2">🏠</div>
          <div className="font-semibold">Agency Listings</div>
          <div className="text-sm text-muted-foreground">View all team listings</div>
        </Link>
        <Link
          href="/agent/leads"
          className="bg-card border rounded-xl p-4 hover:border-primary transition"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">Agency Leads</div>
          <div className="text-sm text-muted-foreground">Manage team leads</div>
        </Link>
        <Link
          href={`/agencies/${agency.slug}`}
          className="bg-card border rounded-xl p-4 hover:border-primary transition"
        >
          <div className="text-2xl mb-2">🌐</div>
          <div className="font-semibold">Public Profile</div>
          <div className="text-sm text-muted-foreground">View agency page</div>
        </Link>
      </div>
    </div>
  );
}
