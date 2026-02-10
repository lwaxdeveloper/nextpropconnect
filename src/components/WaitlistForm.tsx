"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "buyer",
    area: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "You're on the list!");
        setForm({ name: "", email: "", phone: "", role: "buyer", area: "" });
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-fade-in">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-dark mb-2">You&apos;re on the list!</h3>
        <p className="text-gray-600">
          We&apos;ll notify you as soon as NextPropConnect launches. Get ready to experience the future of SA real estate.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-primary font-semibold hover:underline"
        >
          Sign up another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
        />
        <input
          type="email"
          placeholder="Email Address *"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition bg-white"
        >
          <option value="buyer">I&apos;m a Buyer</option>
          <option value="seller">I&apos;m a Seller</option>
          <option value="agent">I&apos;m an Agent</option>
        </select>
      </div>
      <input
        type="text"
        placeholder="Area / Suburb (e.g. Sandton, Soweto, Cape Town CBD)"
        value={form.area}
        onChange={(e) => setForm({ ...form, area: e.target.value })}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition"
      />

      {status === "error" && (
        <p className="text-red-500 text-sm">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-4 gradient-primary text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg disabled:opacity-50 text-lg"
      >
        {status === "loading" ? "Joining..." : "Join the Waitlist — It's Free"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        No spam. We&apos;ll only email you when we launch.
      </p>
    </form>
  );
}
