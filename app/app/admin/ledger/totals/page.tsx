"use client";

import AdminLayout from "../../../../components/admin-layout";
import LedgerOrgTotals from "../../../../components/ledger-org-totals";

export default function AdminLedgerTotalsPage() {
  return (
    <AdminLayout active="ledger-totals">
      <LedgerOrgTotals role="admin" />
    </AdminLayout>
  );
}
