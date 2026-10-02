import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getLandingContent, getPublicDocuments } from "@/lib/content";

export const metadata: Metadata = {
  title: "Documents",
  description: "Official documents published by WAFA Group.",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const [content, documents] = await Promise.all([
    getLandingContent(),
    getPublicDocuments(),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 pb-28 pt-40">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Resources</p>
          <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-tight text-ink">
            Documents
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Official forms, policies, and reports published for members and the public.
          </p>

          {documents.length === 0 ? (
            <p className="mt-16 text-sm text-muted">No documents published yet.</p>
          ) : (
            <div className="mt-14 flex flex-col divide-y divide-line border-y border-line">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{doc.title}</p>
                      {doc.description ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {doc.description}
                        </p>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
