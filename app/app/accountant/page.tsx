import AccountantLayout from "../../components/accountant-layout";

export default function AccountantDashboard() {
  return (
    <AccountantLayout active="overview">
      <main className="max-w-[1190px] mx-auto px-6 pt-20 max-[650px]:px-4 max-[650px]:pt-[68px] h-dvh flex flex-col overflow-hidden">
        <div className="shrink-0 mb-[30px]">
          <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Financial workspace</p>
          <h1 className="m-0 font-display font-bold text-[clamp(32px,4vw,46px)] leading-[1.1]">Overview</h1>
          <p className="mt-[9px] text-muted text-sm">View and manage the financial workspace.</p>
        </div>
      </main>
    </AccountantLayout>
  );
}
