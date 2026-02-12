'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VerificationStatus {
  identity: { verified: boolean; verifiedAt: string | null; status?: string };
  agent: { verified: boolean; verifiedAt: string | null; status?: string };
  agency: { verified: boolean; verifiedAt: string | null; status?: string; isOwner: boolean };
  badge: string | null;
  verifiedProperties: number;
  totalProperties: number;
  userRole: string;
  isAgent: boolean;
  hasAgency: boolean;
  verifications: Array<{
    id: number;
    type: string;
    status: string;
    submitted_at: string;
    rejection_reason: string | null;
  }>;
}

export default function VerifyPage() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/verify/status');
      if (res.status === 401) {
        router.push('/login?redirect=/verify');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  const getOverallProgress = () => {
    if (!status) return 0;
    let total = 1; // Identity is always counted
    let completed = status.identity.verified ? 1 : 0;
    
    if (status.isAgent) {
      total += 1;
      if (status.agent.verified) completed += 1;
    }
    
    if (status.agency.isOwner) {
      total += 1;
      if (status.agency.verified) completed += 1;
    }
    
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Link 
            href="/agent" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <Link 
            href="/agent" 
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Skip for now →
          </Link>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Verification Centre</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Build trust with verified badges. Complete verifications to unlock premium features and stand out.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-card border-2 border-gray-200 rounded-xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 - (175.9 * getOverallProgress()) / 100}
                    className="text-primary transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold">{getOverallProgress()}%</span>
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-lg">Your Verification Progress</h2>
                <p className="text-sm text-muted-foreground">
                  {getOverallProgress() === 100 
                    ? "🎉 Fully verified! You've earned maximum trust."
                    : "Complete verifications to boost your trust score"}
                </p>
              </div>
            </div>
            
            {/* Quick Status Badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              {status?.identity.verified && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  ID Verified
                </span>
              )}
              {status?.agent.verified && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  ✓ Licensed Agent
                </span>
              )}
              {status?.agency.verified && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                  ✓ Verified Agency
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Cards */}
        <div className="space-y-4">
          {/* Identity Verification - Everyone sees this */}
          <VerificationCard
            title="Identity Verification"
            description="Verify your SA ID or passport to get the blue tick badge. This proves you're a real person."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            }
            iconBg="bg-blue-100 text-blue-600"
            status={status?.identity.status || (status?.identity.verified ? 'approved' : 'not_started')}
            verified={status?.identity.verified || false}
            benefits={["Blue tick on your profile", "Higher trust score", "Required for premium features"]}
            href="/verify/identity"
            recommended={!status?.identity.verified}
          />

          {/* Agent Verification - Only for agents */}
          {status?.isAgent && (
            <VerificationCard
              title="Agent License Verification"
              description="Submit your EAAB/PPRA registration to prove you're a licensed estate agent in South Africa."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
              iconBg="bg-green-100 text-green-600"
              status={status?.agent.status || (status?.agent.verified ? 'approved' : 'not_started')}
              verified={status?.agent.verified || false}
              benefits={["Verified Agent badge", "Priority in search results", "Access to agent tools"]}
              href="/verify/agent"
              recommended={status?.identity.verified && !status?.agent.verified}
            />
          )}

          {/* Agency KYC - Only for agency owners */}
          {status?.agency.isOwner && (
            <VerificationCard
              title="Agency KYC Verification"
              description="Complete your agency's business verification with CIPC registration and compliance documents."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              iconBg="bg-purple-100 text-purple-600"
              status={status?.agency.status || (status?.agency.verified ? 'approved' : 'not_started')}
              verified={status?.agency.verified || false}
              benefits={["Verified Agency badge", "Team management features", "Company branding on listings"]}
              href="/verify/agency"
              recommended={status?.agent.verified && !status?.agency.verified}
            />
          )}

          {/* Property Verification - For anyone with listings */}
          {(status?.totalProperties || 0) > 0 && (
            <VerificationCard
              title="Property Ownership Verification"
              description="Prove you own the properties you're listing. Builds buyer confidence and reduces scam concerns."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              iconBg="bg-orange-100 text-orange-600"
              status={(status?.verifiedProperties || 0) > 0 ? 'partial' : 'not_started'}
              verified={(status?.verifiedProperties || 0) > 0}
              benefits={['"Verified Owner" badge on listings', "More inquiries from serious buyers", "Higher listing visibility"]}
              href="/verify/property"
              extraInfo={`${status?.verifiedProperties || 0} of ${status?.totalProperties || 0} properties verified`}
            />
          )}
        </div>

        {/* Not an Agent? CTA */}
        {!status?.isAgent && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">Are you an Estate Agent?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Upgrade to an Agent account to access agent verification, CRM tools, and premium features.
            </p>
            <Link
              href="/become-agent"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Become an Agent
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}

        {/* Recent Verifications */}
        {status?.verifications && status.verifications.length > 0 && (
          <div className="bg-card border-2 border-gray-200 rounded-xl p-6 shadow-md">
            <h2 className="font-semibold mb-4">Verification History</h2>
            <div className="space-y-3">
              {status.verifications.map(v => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{v.type.replace('_', ' ')} Verification</div>
                    <div className="text-sm text-muted-foreground">
                      Submitted {new Date(v.submitted_at).toLocaleDateString('en-ZA', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                    {v.rejection_reason && (
                      <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {v.rejection_reason}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="text-center text-sm text-muted-foreground space-y-2 pb-8">
          <p>Need help with verification? Contact support at <a href="mailto:support@nextpropconnect.co.za" className="text-primary hover:underline">support@nextpropconnect.co.za</a></p>
          <p>Verifications are typically reviewed within 24-48 hours.</p>
        </div>
      </div>
    </div>
  );
}

function VerificationCard({ 
  title, 
  description, 
  icon, 
  iconBg,
  status, 
  verified, 
  benefits, 
  href,
  recommended,
  extraInfo
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  status: string;
  verified: boolean;
  benefits: string[];
  href: string;
  recommended?: boolean;
  extraInfo?: string;
}) {
  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return { text: 'Verified', color: 'text-green-600 bg-green-50 border-green-200', icon: '✓' };
      case 'pending':
        return { text: 'Under Review', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '⏳' };
      case 'rejected':
        return { text: 'Rejected - Resubmit', color: 'text-red-600 bg-red-50 border-red-200', icon: '✗' };
      case 'partial':
        return { text: 'Partially Verified', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '◐' };
      default:
        return { text: 'Not Started', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: '○' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`bg-card border-2 rounded-xl overflow-hidden shadow-md transition hover:shadow-lg ${
      verified ? 'border-green-200' : recommended ? 'border-primary' : 'border-gray-200'
    }`}>
      {recommended && !verified && (
        <div className="bg-primary text-primary-foreground text-xs font-medium px-4 py-1 text-center">
          ⭐ Recommended Next Step
        </div>
      )}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          {/* Icon & Title */}
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <h3 className="font-semibold text-lg">{title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color} self-start`}>
                {statusInfo.icon} {statusInfo.text}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            
            {/* Benefits */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-1 text-sm text-muted-foreground">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </div>
              ))}
            </div>

            {extraInfo && (
              <p className="text-sm text-muted-foreground mb-3 italic">{extraInfo}</p>
            )}
            
            {/* CTA Button */}
            <Link
              href={href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                verified 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {verified ? (
                <>
                  View Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : status === 'pending' ? (
                <>
                  Check Status
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </>
              ) : status === 'rejected' ? (
                <>
                  Resubmit Verification
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </>
              ) : (
                <>
                  Start Verification
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  };
  
  const { bg, text } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${bg} ${text}`}>
      {status}
    </span>
  );
}
