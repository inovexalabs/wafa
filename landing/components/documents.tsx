"use client";

import { motion } from "motion/react";
import { Download, FileText } from "lucide-react";
import type { PublicDocument } from "@/lib/content";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents({ documents }: { documents: PublicDocument[] }) {
  return (
    <section id="documents" className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Resources</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-tight text-ink">
            Documents
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Official forms, policies, and reports published for members and the public.
          </p>
        </div>

        {documents.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted">No documents published yet.</p>
        ) : (
          <div className="mt-14 flex flex-col divide-y divide-line border-y border-line">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
                className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{doc.title}</p>
                    {doc.description ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted">{doc.description}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-muted">
                      {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Download
                  <Download className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
