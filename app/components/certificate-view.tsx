"use client";

import { ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { FileDown, ImageDown, Loader2 } from "lucide-react";

export const CERTIFICATE_STAGE_WIDTH = 1123;
export const CERTIFICATE_STAGE_HEIGHT = 794;

export interface CertificateTokens {
  name?: string;
  title?: string;
  certificateNumber?: string;
  date?: string;
  description?: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applyTokens(html: string, tokens: CertificateTokens) {
  const map: Record<string, string> = {
    NAME: escapeHtml(tokens.name ?? ""),
    TITLE: escapeHtml(tokens.title ?? ""),
    CERT_NUMBER: escapeHtml(tokens.certificateNumber ?? ""),
    DATE: escapeHtml(tokens.date ?? ""),
    DESCRIPTION: escapeHtml(tokens.description ?? ""),
  };
  return html.replace(/\{\{\s*([A-Za-z_]+)\s*\}\}/g, (match, key: string) => {
    const upper = key.toUpperCase();
    return upper in map ? map[upper] : match;
  });
}

/** Split a certificate template into its body markup and its <style> rules (scripts are dropped). */
function splitTemplate(html: string) {
  let css = "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_match, styleBody: string) => {
      css += styleBody + "\n";
      return "";
    });
  return { body, css };
}

/** Prefix every CSS rule in a template stylesheet with a scope selector so template styles cannot leak into the app. */
function scopeCss(css: string, scopeSelector: string): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "";
  let index = 0;
  const length = withoutComments.length;

  while (index < length) {
    const braceIndex = withoutComments.indexOf("{", index);
    if (braceIndex === -1) {
      out += withoutComments.slice(index);
      break;
    }
    const prelude = withoutComments.slice(index, braceIndex).trim();

    if (prelude.startsWith("@")) {
      const atName = prelude.slice(1).split(/\s/)[0].toLowerCase();
      let depth = 1;
      let cursor = braceIndex + 1;
      while (cursor < length && depth > 0) {
        const char = withoutComments[cursor];
        if (char === "{") depth += 1;
        else if (char === "}") depth -= 1;
        cursor += 1;
      }
      const body = withoutComments.slice(braceIndex + 1, cursor - 1);
      if (["media", "supports", "container", "layer"].includes(atName)) {
        out += prelude + "{" + scopeCss(body, scopeSelector) + "}";
      } else {
        out += prelude + "{" + body + "}";
      }
      index = cursor;
      continue;
    }

    const closeIndex = withoutComments.indexOf("}", braceIndex);
    if (closeIndex === -1) {
      out += withoutComments.slice(index);
      break;
    }
    const body = withoutComments.slice(braceIndex + 1, closeIndex);
    const scopedSelectors = prelude
      .split(",")
      .map((selector) => {
        const trimmed = selector.trim();
        if (!trimmed) return trimmed;
        if (/^(html|body|:root)$/i.test(trimmed)) return scopeSelector;
        return `${scopeSelector} ${trimmed}`;
      })
      .filter(Boolean)
      .join(", ");
    out += scopedSelectors + "{" + body + "}";
    index = closeIndex + 1;
  }

  return out;
}

export function defaultCertificateTemplate(): string {
  return `<div style="width:100%;height:100%;position:relative;box-sizing:border-box;background:#f7f8f4;font-family:'DM Sans',sans-serif;color:#17201d;">
  <div style="position:absolute;inset:26px;border:2px solid #1f6752;border-radius:14px;box-sizing:border-box;"></div>
  <div style="position:absolute;inset:34px;border:1px solid #c9a227;border-radius:9px;box-sizing:border-box;"></div>
  <div style="position:absolute;top:74px;left:0;right:0;text-align:center;">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:74px;height:74px;border-radius:9999px;background:#1f6752;color:#ffffff;font-size:34px;font-weight:700;">W</div>
  </div>
  <div style="position:absolute;top:168px;left:0;right:0;text-align:center;">
    <div style="font-size:13px;letter-spacing:.32em;text-transform:uppercase;color:#1f6752;font-weight:700;">WAFA Group</div>
    <div style="margin-top:26px;font-family:'Playfair Display',serif;font-size:44px;font-weight:700;color:#17201d;">Certificate of Achievement</div>
    <div style="margin-top:18px;font-size:15px;color:#71807a;">This certificate is proudly presented to</div>
    <div style="margin-top:14px;font-family:'Playfair Display',serif;font-size:36px;font-weight:700;color:#1f6752;">{{NAME}}</div>
    <div style="margin:22px auto 0;max-width:640px;font-size:15px;line-height:1.6;color:#41544b;">{{DESCRIPTION}}</div>
  </div>
  <div style="position:absolute;bottom:96px;left:96px;right:96px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div style="text-align:left;">
      <div style="width:190px;border-top:1.5px solid #17201d;padding-top:9px;font-size:12px;font-weight:700;color:#17201d;">WAFA Admin</div>
      <div style="margin-top:4px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#71807a;">Issued by</div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:13px;font-weight:700;color:#17201d;">{{DATE}}</div>
      <div style="margin-top:4px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#71807a;">Date issued</div>
    </div>
    <div style="text-align:right;">
      <div style="width:190px;border-top:1.5px solid #17201d;padding-top:9px;font-size:12px;font-weight:700;color:#17201d;">{{CERT_NUMBER}}</div>
      <div style="margin-top:4px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#71807a;">Certificate number</div>
    </div>
  </div>
</div>`;
}

function useStageScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setScale(Math.min(1, width / CERTIFICATE_STAGE_WIDTH));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return scale;
}

function StageMarkup({ stageId, templateHtml, tokens }: { stageId: string; templateHtml: string; tokens: CertificateTokens }) {
  const { body, css } = useMemo(() => splitTemplate(templateHtml), [templateHtml]);
  const scopedCss = useMemo(() => scopeCss(css, `.wa-cert-stage-${stageId}`), [css, stageId]);
  const html = useMemo(() => applyTokens(body, tokens), [body, tokens]);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

/** A fixed-size A4 landscape stage that renders certificate HTML, scaled down to fit its container. */
export function CertificateStage({
  templateHtml,
  tokens,
  className,
}: {
  templateHtml: string;
  tokens: CertificateTokens;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scale = useStageScale(wrapRef);
  const stageId = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div ref={wrapRef} className={className} style={{ width: "100%" }}>
      <div style={{ height: CERTIFICATE_STAGE_HEIGHT * scale, overflow: "hidden", opacity: scale ? 1 : 0 }}>
        <div
          className={`wa-cert-stage-${stageId}`}
          style={{
            width: CERTIFICATE_STAGE_WIDTH,
            height: CERTIFICATE_STAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            overflow: "hidden",
            background: "#ffffff",
            color: "#17201d",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <StageMarkup stageId={stageId} templateHtml={templateHtml} tokens={tokens} />
        </div>
      </div>
    </div>
  );
}

function slugifyFileName(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "certificate";
}

async function captureStage(element: HTMLElement) {
  const html2canvas = (await import("html2canvas-pro")).default;
  return html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
}

/** Full certificate viewer: scaled HTML preview plus PDF/PNG download actions. */
export default function CertificateView({
  templateHtml,
  tokens,
  fileName = "certificate",
  header,
  className,
}: {
  templateHtml: string;
  tokens: CertificateTokens;
  fileName?: string;
  header?: ReactNode;
  className?: string;
}) {
  const exportStageRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<"pdf" | "png" | null>(null);
  const [exportError, setExportError] = useState("");
  const stageId = useId().replace(/[^a-zA-Z0-9]/g, "");

  async function exportAs(kind: "pdf" | "png") {
    const stage = exportStageRef.current;
    if (!stage || isExporting) return;
    setIsExporting(kind);
    setExportError("");
    try {
      const canvas = await captureStage(stage);
      if (kind === "png") {
        const link = document.createElement("a");
        link.download = `${slugifyFileName(fileName)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [CERTIFICATE_STAGE_WIDTH, CERTIFICATE_STAGE_HEIGHT], compress: true });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, CERTIFICATE_STAGE_WIDTH, CERTIFICATE_STAGE_HEIGHT);
        pdf.save(`${slugifyFileName(fileName)}.pdf`);
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to export this certificate.");
    } finally {
      setIsExporting(null);
    }
  }

  const actionButton =
    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold cursor-pointer border-0 no-underline disabled:opacity-60 disabled:cursor-wait transition-transform hover:-translate-y-0.5";

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-[14px]">
        {header}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={actionButton + " text-brand border border-brand/30 bg-transparent hover:bg-brand hover:text-white disabled:hover:translate-y-0 disabled:hover:bg-transparent disabled:hover:text-brand"}
            onClick={() => void exportAs("pdf")}
            disabled={isExporting !== null}
          >
            {isExporting === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} Download PDF
          </button>
          <button
            type="button"
            className={actionButton + " text-brand border border-brand/30 bg-transparent hover:bg-brand hover:text-white disabled:hover:translate-y-0 disabled:hover:bg-transparent disabled:hover:text-brand"}
            onClick={() => void exportAs("png")}
            disabled={isExporting !== null}
          >
            {isExporting === "png" ? <Loader2 size={13} className="animate-spin" /> : <ImageDown size={13} />} Download PNG
          </button>
        </div>
      </div>
      {exportError && <p className="m-0 mb-3 text-[11px] text-[#ae4d44]" role="alert">{exportError}</p>}
      <CertificateStage templateHtml={templateHtml} tokens={tokens} className="rounded-[10px] border border-[#e1e9e4] overflow-hidden bg-white" />
      {/* Offscreen, unscaled stage used as the capture source for exports. */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", left: "-30000px", top: 0, width: CERTIFICATE_STAGE_WIDTH, height: CERTIFICATE_STAGE_HEIGHT, pointerEvents: "none", zIndex: -1 }}
      >
        <div
          ref={exportStageRef}
          className={`wa-cert-stage-${stageId}`}
          style={{
            width: CERTIFICATE_STAGE_WIDTH,
            height: CERTIFICATE_STAGE_HEIGHT,
            position: "relative",
            overflow: "hidden",
            background: "#ffffff",
            color: "#17201d",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <StageMarkup stageId={stageId} templateHtml={templateHtml} tokens={tokens} />
        </div>
      </div>
    </div>
  );
}
