'use client';

import { Shield, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface TrustScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TrustScoreBadge({ 
  score, 
  size = 'md',
  showLabel = true,
}: TrustScoreBadgeProps) {
  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    if (score >= 60) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  };

  const getLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  const colors = getColor(score);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${sizeClasses[size]} ${colors.bg} ${colors.border} border-2 rounded-full flex items-center justify-center font-bold ${colors.text}`}
      >
        {score}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={`font-medium ${colors.text} text-sm`}>
            {getLabel(score)}
          </span>
          <span className="text-xs text-gray-500">Trust Score</span>
        </div>
      )}
    </div>
  );
}

interface TrustScoreCardProps {
  score: number;
  totalReviews: number;
  averageRating: number;
  responseRate?: number;
  avgResponseTime?: number;
  completedTransactions?: number;
  isVerified?: boolean;
}

export function TrustScoreCard({
  score,
  totalReviews,
  averageRating,
  responseRate = 0,
  avgResponseTime,
  completedTransactions = 0,
  isVerified = false,
}: TrustScoreCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Trust Score
        </h3>
        {isVerified && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Verified Agent
          </span>
        )}
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-4">
        <TrustScoreBadge score={score} size="lg" />
        
        <div className="flex-1 space-y-1">
          {/* Progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                score >= 80 ? 'bg-green-500' :
                score >= 60 ? 'bg-blue-500' :
                score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Based on reviews, response rate, and transaction history
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{averageRating}</p>
            <p className="text-xs text-gray-500">{totalReviews} reviews</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{responseRate}%</p>
            <p className="text-xs text-gray-500">Response rate</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">{completedTransactions}</p>
            <p className="text-xs text-gray-500">Transactions</p>
          </div>
        </div>
        
        {avgResponseTime && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {avgResponseTime < 1 ? '<1h' : `${Math.round(avgResponseTime)}h`}
              </p>
              <p className="text-xs text-gray-500">Avg response</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
