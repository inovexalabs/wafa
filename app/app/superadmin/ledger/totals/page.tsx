"use client";

import SuperadminLayout from "../../../../components/superadmin-layout";
import LedgerOrgTotals from "../../../../components/ledger-org-totals";

export default function SuperadminLedgerTotalsPage() {
  return (
    <SuperadminLayout active="ledger-totals">
      <LedgerOrgTotals role="superadmin" />
    </SuperadminLayout>
  );
}
