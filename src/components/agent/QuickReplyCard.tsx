"use client";

import { useState } from "react";

interface Template {
  id: number;
  title: string;
  content: string;
  category: string;
  usage_count: number;
}

const categoryColors: Record<string, string> = {
  general: "bg-gray-100 text-gray-600",
  viewing: "bg-purple-50 text-purple-600",
  availability: "bg-blue-50 text-blue-600",
  price: "bg-green-50 text-green-600",
  documents: "bg-orange-50 text-orange-600",
};

export default function QuickReplyCard({
  template,
  onEdit,
  onDelete,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onDelete: (id: number) => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyContent() {
    navigator.clipboard.writeText(template.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-dark text-sm">{template.title}</h3>
          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 capitalize ${categoryColors[template.category] || categoryColors.general}`}>
            {template.category}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition text-xs"
            title="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition text-xs"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3 whitespace-pre-wrap">
        {template.content}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">Used {template.usage_count}×</span>
        <button
          onClick={copyContent}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            copied
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      </div>
    </div>
  );
}
