"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = { title: string; onClose: () => void; children: ReactNode; wide?: boolean };

export default function Modal({ title, onClose, children, wide }: ModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"w-full " + (wide ? "max-w-[640px]" : "max-w-[440px]") + " max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_24px_60px_-20px_rgba(22,75,60,0.45)]"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="m-0 font-display font-bold text-lg text-ink">{title}</h2>
          <button
            type="button"
            className="grid place-items-center w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer text-muted hover:bg-[#f0f2f0]"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
