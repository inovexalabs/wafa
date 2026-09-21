"use client";

import { useEffect, useState } from "react";
import { Award, Eye } from "lucide-react";
import MemberLayout from "../../../components/member-layout";
import CertificateView from "../../../components/certificate-view";
import { Certificate, getMemberProfile, listMyCertificates } from "../../../lib/auth";

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    listMyCertificates()
      .then(setCertificates)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load your certificates."))
      .finally(() => setIsLoading(false));
  }, []);

  const [userName, setUserName] = useState("");
  const current = certificates.find((c) => c.id === selected) ?? certificates[0] ?? null;

  useEffect(() => {
    getMemberProfile().then((p) => setUserName(p.fullName)).catch(() => {});
  }, []);

  return (
    <MemberLayout active="certificates">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 pb-2 max-[650px]:px-4 max-[650px]:pt-[68px] max-[650px]:pb-2 min-h-[calc(100vh-76px)]">
        <div className="flex justify-between items-end gap-5 mb-[30px] max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Your achievements</p>
            <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Certificates</h1>
            <p className="mt-[9px] text-muted text-sm">View and download certificates awarded to you.</p>
          </div>
        </div>

        <div className="grid grid-cols-[.8fr_1.4fr] gap-[18px] max-[780px]:grid-cols-1">
          <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
            <h2 className="m-0 font-display font-bold text-[23px]">Your certificates</h2>
            <p className="my-[7px] mb-[22px] text-[#8b9992] text-[11px]">Click a certificate to preview it below.</p>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => <div key={i} className="h-[54px] rounded-md bg-[#edf1ee] animate-pulse" />)}
              </div>
            ) : loadError ? (
              <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{loadError}</p>
            ) : certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl border border-dashed border-line text-center">
                <div className="w-11 h-11 rounded-full bg-[#eef1ee] grid place-items-center text-muted"><Award size={18} /></div>
                <p className="text-xs font-semibold text-ink">No certificates yet</p>
                <p className="text-[10px] text-muted max-w-[180px]">Certificates awarded by WAFA admins will appear here.</p>
              </div>
            ) : (
              <div>
                {certificates.map((cert) => (
                  <button
                    key={cert.id}
                    type="button"
                    className={`flex items-center gap-[10px] w-full py-[14px] border-t border-[#edf1ee] first:border-t-0 cursor-pointer bg-transparent border-x-0 text-left transition-colors hover:bg-[#f8faf8] ${selected === cert.id ? "bg-[#f0f7f0]" : ""}`}
                    onClick={() => setSelected(cert.id)}
                  >
                    <span className="grid place-items-center w-8 h-[34px] rounded-md text-[#1f6752] bg-[#e4f4ec] shrink-0">
                      <Award size={14} />
                    </span>
                    <p className="flex-1 min-w-0 m-0">
                      <strong className="block text-[10px] font-bold text-[#2d4037] truncate">{cert.title}</strong>
                      <small className="block mt-1 text-[#9ba7a1] text-[9px]">{cert.certificateNumber} · {formatDate(cert.issuedAt)}</small>
                    </p>
                    <span className="text-[9px] text-muted shrink-0"><Eye size={12} /></span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="p-6 border border-[#e1e9e4] rounded-[10px] bg-white max-[500px]:px-4 max-[500px]:py-[19px]">
            <h2 className="m-0 font-display font-bold text-[23px]">Preview</h2>
            <p className="my-[7px] mb-[22px] text-[#8b9992] text-[11px]">Download your certificate as PDF or PNG.</p>
            {!current ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl border border-dashed border-line text-center">
                <p className="text-xs text-muted">Select a certificate to preview.</p>
              </div>
            ) : (
              <CertificateView
                templateHtml={current.templateHtml}
                tokens={{
                  name: userName || "Certificate Holder",
                  title: current.title,
                  certificateNumber: current.certificateNumber,
                  date: formatDate(current.issuedAt),
                  description: current.description || "",
                }}
                fileName={`${current.certificateNumber}`}
              />
            )}
          </section>
        </div>
      </main>
    </MemberLayout>
  );
}
