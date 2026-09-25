"use client";

import AccountantLayout from "../../../../components/accountant-layout";
import LedgerOrgTotals from "../../../../components/ledger-org-totals";

export default function AccountantLedgerTotalsPage() {
  return (
    <AccountantLayout active="ledger-totals">
      <LedgerOrgTotals role="accountant" />
    </AccountantLayout>
  );
}
