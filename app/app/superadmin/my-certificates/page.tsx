"use client";

import { useEffect, useState } from "react";
import { Award, Eye, AwardIcon } from "lucide-react";
import SuperadminLayout from "../../../components/superadmin-layout";
import Modal from "../../../components/modal";
import CertificateView from "../../../components/certificate-view";
import { Certificate, getStaffProfile, listMyIssuerCertificates } from "../../../lib/auth";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PreviewModal({ certificate, userName, onClose }: { certificate: Certificate; userName: string; onClose: () => void }) {
  return (
    <Modal title={`Certificate · ${certificate.certificateNumber}`} onClose={onClose} wide>
      <CertificateView
        templateHtml={certificate.templateHtml}
        tokens={{
          name: userName || "Certificate Holder",
          title: certificate.title,
          certificateNumber: certificate.certificateNumber,
          date: formatDate(certificate.issuedAt),
          description: certificate.description || "",
        }}
        fileName={`${certificate.certificateNumber}`}
      />
    </Modal>
  );
}

export default function SuperadminMyCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    listMyIssuerCertificates("superadmin")
      .then(setCertificates)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load your certificates."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    getStaffProfile("superadmin").then((p) => setUserName(p.fullName ?? p.userId)).catch(() => {});
  }, []);

  return (
    <SuperadminLayout active="my-certificates">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-end gap-5 mb-10 max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Your achievements</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">My certificates</h1>
            <p className="mt-[9px] text-muted text-sm">View and download certificates awarded to you.</p>
          </div>
          {!isLoading && certificates.length > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
              <Award size={15} /> {certificates.length} awarded
            </div>
          )}
        </div>

        <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[86px] rounded-2xl bg-[#edf1ee] animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-6 rounded-2xl border border-dashed border-line bg-white text-center">
            <div className="w-14 h-14 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><AwardIcon size={22} /></div>
            <p className="text-sm font-semibold text-ink">No certificates yet</p>
            <p className="text-xs text-muted max-w-[240px]">Certificates awarded to you will appear here.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-white">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-5 p-5 border-b border-line last:border-b-0 transition-colors hover:bg-[#f8faf8]">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-[#e4f4ec] text-[#1f6752] shrink-0">
                  <Award size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[15px] text-ink truncate mb-1">{cert.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{cert.certificateNumber}</span>
                    <span>·</span>
                    <span>{formatDate(cert.issuedAt)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="grid place-items-center w-9 h-9 rounded-full border border-line text-muted bg-white cursor-pointer transition-colors hover:border-brand/30 hover:text-brand shrink-0"
                  onClick={() => setPreviewCertificate(cert)}
                  aria-label="Preview certificate"
                  title="Preview & download"
                >
                  <Eye size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {previewCertificate && (
        <PreviewModal certificate={previewCertificate} userName={userName} onClose={() => setPreviewCertificate(null)} />
      )}
    </SuperadminLayout>
  );
}
