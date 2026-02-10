'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { DISPUTE_CATEGORIES, DisputeCategory } from '@/types/reviews';

interface ReportFormProps {
  reportType: 'user' | 'property' | 'review';
  reportedId: number;
  reportedName?: string;
  onSubmit: (data: {
    category: DisputeCategory;
    title: string;
    description: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function ReportForm({
  reportType,
  reportedId,
  reportedName,
  onSubmit,
  onClose,
}: ReportFormProps) {
  const [category, setCategory] = useState<DisputeCategory | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('Please select a category');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }

    if (description.length < 20) {
      setError('Please provide more details (at least 20 characters)');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        category,
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Report {reportType === 'user' ? 'Agent' : reportType === 'property' ? 'Listing' : 'Review'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {reportedName && (
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              Reporting: <span className="font-medium">{reportedName}</span>
            </p>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What type of issue is this? *
            </label>
            <div className="space-y-2">
              {Object.entries(DISPUTE_CATEGORIES).map(([key, info]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    category === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={category === key}
                    onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{info.label}</p>
                    <p className="text-xs text-gray-500">{info.description}</p>
                  </div>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    info.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    info.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                    info.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {info.severity}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Brief Summary *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Agent asked for deposit to wrong account"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible. Include dates, amounts, and any evidence you have..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> False reports may result in action against your account. 
              Only report genuine issues. Our team will investigate within 24-48 hours.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !category}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
