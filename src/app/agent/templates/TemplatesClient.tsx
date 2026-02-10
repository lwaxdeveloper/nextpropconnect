"use client";

import { useState } from "react";
import QuickReplyCard from "@/components/agent/QuickReplyCard";

interface Template {
  id: number;
  title: string;
  content: string;
  category: string;
  usage_count: number;
}

const categories = ["general", "viewing", "availability", "price", "documents"];

export default function TemplatesClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [filterCat, setFilterCat] = useState("");

  async function refreshTemplates() {
    const res = await fetch("/api/agent/templates");
    const data = await res.json();
    setTemplates(data);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setTitle(t.title);
    setContent(t.content);
    setCategory(t.category);
    setShowForm(true);
  }

  function openNew() {
    setEditing(null);
    setTitle("");
    setContent("");
    setCategory("general");
    setShowForm(true);
  }

  async function save() {
    if (!title.trim() || !content.trim()) return;

    if (editing) {
      await fetch("/api/agent/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, title, content, category }),
      });
    } else {
      await fetch("/api/agent/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
    }

    await refreshTemplates();
    setShowForm(false);
    setEditing(null);
  }

  async function deleteTemplate(id: number) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/agent/templates?id=${id}`, { method: "DELETE" });
    await refreshTemplates();
  }

  const filtered = filterCat ? templates.filter((t) => t.category === filterCat) : templates;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCat("")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${!filterCat ? "bg-dark text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition capitalize ${filterCat === cat ? "bg-dark text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={openNew}
          className="ml-auto px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition"
        >
          + New Template
        </button>
      </div>

      {/* Placeholder Legend */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-blue-600 mb-1">Available Placeholders</p>
        <div className="flex flex-wrap gap-2">
          {["{buyer_name}", "{property_name}", "{price}"].map((p) => (
            <code key={p} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{p}</code>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="font-bold text-dark mb-2">No templates yet</h3>
          <p className="text-sm text-gray-500 mb-4">Create quick reply templates to save time when messaging buyers.</p>
          <button onClick={openNew} className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition">
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <QuickReplyCard key={t.id} template={t} onEdit={openEdit} onDelete={deleteTemplate} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-dark mb-4">
              {editing ? "Edit Template" : "New Template"}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Template Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <textarea
                placeholder="Template content... Use {buyer_name}, {property_name}, {price} as placeholders"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!title.trim() || !content.trim()}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl disabled:opacity-50 text-sm"
              >
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
