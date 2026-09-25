"use client";

import AdminLayout from "../../../components/admin-layout";
import LedgerTable from "../../../components/ledger-table";

export default function AdminLedgerPage() {
  return (
    <AdminLayout active="ledger">
      <LedgerTable role="admin" />
    </AdminLayout>
  );
}
