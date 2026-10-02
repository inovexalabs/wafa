"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

export default function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Message from ${name || "the WAFA website"}`);
    const body = encodeURIComponent(
      `${message}\n\n— ${name}${senderEmail ? ` (${senderEmail})` : ""}`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="text"
          required
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand"
        />
        <input
          type="email"
          placeholder="Your email"
          value={senderEmail}
          onChange={(event) => setSenderEmail(event.target.value)}
          className="rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand"
        />
      </div>
      <textarea
        required
        placeholder="Your message"
        rows={5}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        className="rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand"
      />
      <button
        type="submit"
        className="group inline-flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(31,103,82,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark"
      >
        Send us a message
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
