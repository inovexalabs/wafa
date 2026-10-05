"use client";

import { ReactNode, useState } from "react";
import { FileDown, ImageDown, ImageOff, Loader2 } from "lucide-react";
import type { Certificate } from "../lib/auth";

function slugifyFileName(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "certificate";
}

function triggerDownload(href: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = href;
  link.click();
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function imageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Unable to read the certificate image."));
    image.src = src;
  });
}

/** Certificate viewer: the uploaded PNG plus PNG/PDF download actions. */
export default function CertificateView({
  certificate,
  fileName = "certificate",
  header,
  className,
}: {
  certificate: Pick<Certificate, "imageUrl" | "title">;
  fileName?: string;
  header?: ReactNode;
  className?: string;
}) {
  const [isExporting, setIsExporting] = useState<"pdf" | "png" | null>(null);
  const [exportError, setExportError] = useState("");
  const { imageUrl } = certificate;

  async function exportAs(kind: "pdf" | "png") {
    if (!imageUrl || isExporting) return;
    setIsExporting(kind);
    setExportError("");
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("This certificate link has expired. Reload the page and try again.");
      const blob = await response.blob();
      const baseName = slugifyFileName(fileName);
      if (kind === "png") {
        const objectUrl = URL.createObjectURL(blob);
        triggerDownload(objectUrl, `${baseName}.png`);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else {
        const dataUrl = await blobToDataUrl(blob);
        const { width, height } = await imageSize(dataUrl);
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: width >= height ? "landscape" : "portrait", unit: "px", format: [width, height], compress: true });
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
        pdf.save(`${baseName}.pdf`);
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to download this certificate.");
    } finally {
      setIsExporting(null);
    }
  }

  const actionButton =
    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold cursor-pointer no-underline disabled:opacity-60 disabled:cursor-wait transition-transform hover:-translate-y-0.5 text-brand border border-brand/30 bg-transparent hover:bg-brand hover:text-white disabled:hover:translate-y-0 disabled:hover:bg-transparent disabled:hover:text-brand";

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-[14px]">
        {header}
        {imageUrl && (
          <div className="flex items-center gap-2">
            <button type="button" className={actionButton} onClick={() => void exportAs("pdf")} disabled={isExporting !== null}>
              {isExporting === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} Download PDF
            </button>
            <button type="button" className={actionButton} onClick={() => void exportAs("png")} disabled={isExporting !== null}>
              {isExporting === "png" ? <Loader2 size={13} className="animate-spin" /> : <ImageDown size={13} />} Download PNG
            </button>
          </div>
        )}
      </div>
      {exportError && <p className="m-0 mb-3 text-[11px] text-[#ae4d44]" role="alert">{exportError}</p>}
      {imageUrl ? (
        <img src={imageUrl} alt={certificate.title} className="block w-full h-auto rounded-[10px] border border-[#e1e9e4] bg-white" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-14 px-6 rounded-[10px] border border-dashed border-line bg-[#f8faf8] text-center">
          <ImageOff size={22} className="text-muted" />
          <p className="m-0 text-sm font-semibold text-ink">No certificate image</p>
          <p className="m-0 text-xs text-muted max-w-[280px]">This certificate was issued before PNG uploads. An admin can re-issue it with an image.</p>
        </div>
      )}
    </div>
  );
}
