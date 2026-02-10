'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';

interface ReviewFormProps {
  agentId: number;
  agentName: string;
  propertyId?: number;
  propertyTitle?: string;
  transactionType?: 'sale' | 'rental' | 'viewing';
  onSubmit: (data: {
    rating: number;
    title: string;
    content: string;
    transaction_type: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function ReviewForm({
  agentId,
  agentName,
  propertyId,
  propertyTitle,
  transactionType = 'sale',
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [txType, setTxType] = useState(transactionType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (content.length < 10) {
      setError('Please write at least a few words about your experience');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        title,
        content,
        transaction_type: txType,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = [
    '',
    'Poor',
    'Fair',
    'Good',
    'Very Good',
    'Excellent',
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Review {agentName}
        </h3>
        {propertyTitle && (
          <p className="text-sm text-gray-500">
            For: {propertyTitle}
          </p>
        )}
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating *
        </label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hoverRating || rating) > 0 && (
            <span className="text-sm font-medium text-gray-600">
              {ratingLabels[hoverRating || rating]}
            </span>
          )}
        </div>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction Type
        </label>
        <div className="flex gap-4">
          {(['sale', 'rental', 'viewing'] as const).map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="radio"
                name="transaction_type"
                value={type}
                checked={txType === type}
                onChange={(e) => setTxType(e.target.value as typeof txType)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Review Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={200}
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Your Review *
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share details about your experience with this agent..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {content.length}/500 characters
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Review
        </button>
      </div>
    </form>
  );
}
