"use client";

import AdminLayout from "../../components/admin-layout";

export default function AdminOverviewPage() {
  return (
    <AdminLayout active="overview">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0 flex justify-between items-end gap-5 max-[650px]:items-start max-[650px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Admin workspace</p>
            <h1 className="m-0 font-display font-bold text-[clamp(30px,3.4vw,44px)] leading-[1.1] max-[650px]:text-[32px]">Welcome back.</h1>
            <p className="mt-[10px] text-muted text-sm">Manage meetings and members from the sidebar.</p>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
