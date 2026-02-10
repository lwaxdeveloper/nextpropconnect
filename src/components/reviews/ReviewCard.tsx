'use client';

import { useState } from 'react';
import { Star, ThumbsUp, CheckCircle, MessageSquare, MoreVertical, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Review } from '@/types/reviews';

interface ReviewCardProps {
  review: Review;
  isAgentView?: boolean;
  onRespond?: (reviewId: number) => void;
  onReport?: (reviewId: number) => void;
  onVote?: (reviewId: number, isHelpful: boolean) => void;
}

export function ReviewCard({ 
  review, 
  isAgentView = false,
  onRespond,
  onReport,
  onVote,
}: ReviewCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [voted, setVoted] = useState(false);

  const handleVote = async (helpful: boolean) => {
    if (voted) return;
    setVoted(true);
    onVote?.(review.id, helpful);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {review.reviewer_avatar ? (
            <img 
              src={review.reviewer_avatar} 
              alt={review.reviewer_name || 'Reviewer'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {(review.reviewer_name || 'A')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {review.reviewer_name || 'Anonymous'}
              </span>
              {review.is_verified_transaction && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
              {review.property_suburb && (
                <>
                  <span>•</span>
                  <span>{review.property_suburb}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Star Rating */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                {isAgentView && !review.response && (
                  <button
                    onClick={() => {
                      onRespond?.(review.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Respond
                  </button>
                )}
                <button
                  onClick={() => {
                    onReport?.(review.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {review.title && (
        <h4 className="font-medium text-gray-900">{review.title}</h4>
      )}
      {review.content && (
        <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
      )}

      {/* Agent Response */}
      {review.response && (
        <div className="bg-gray-50 rounded-lg p-3 mt-3 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Agent Response</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(review.response.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-600">{review.response.content}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleVote(true)}
            disabled={voted}
            className={`flex items-center gap-1 text-sm ${
              voted ? 'text-gray-400' : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful ({review.helpful_count})</span>
          </button>
        </div>
        <span className="text-xs text-gray-400 capitalize">
          {review.transaction_type}
        </span>
      </div>
    </div>
  );
}
