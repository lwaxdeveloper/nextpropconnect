import Link from "next/link";

interface ProfileCompletionCardProps {
  score: number;
  missing: string[];
  isVerified: boolean;
  identityVerified: boolean;
}

export default function ProfileCompletionCard({ 
  score, 
  missing, 
  isVerified, 
  identityVerified 
}: ProfileCompletionCardProps) {
  const getScoreColor = () => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-md p-6">
      <div className="flex items-start justify-between gap-6">
        {/* Score Circle */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${(score / 100) * 220} 220`}
                className={getProgressColor().replace('bg-', 'text-')}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${getScoreColor()}`}>{score}%</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Profile Completion</h3>
            <p className="text-sm text-gray-500">
              {score >= 80 ? "Great job! Your profile is strong." :
               score >= 50 ? "Good progress! Complete more to stand out." :
               "Complete your profile to get more leads."}
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex flex-col gap-2 text-sm">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {isVerified ? '✓' : '!'} Agent {isVerified ? 'Verified' : 'Unverified'}
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            identityVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {identityVerified ? '✓' : '!'} ID {identityVerified ? 'Verified' : 'Unverified'}
          </div>
          {(!isVerified || !identityVerified) && (
            <Link
              href="/verify/identity"
              className="text-primary hover:underline text-xs mt-1"
            >
              Complete verification →
            </Link>
          )}
        </div>
      </div>

      {/* Missing Items */}
      {missing.length > 0 && score < 100 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">Complete these to improve:</p>
          <div className="flex flex-wrap gap-2">
            {missing.slice(0, 5).map((item) => (
              <span
                key={item}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {item}
              </span>
            ))}
            {missing.length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{missing.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
