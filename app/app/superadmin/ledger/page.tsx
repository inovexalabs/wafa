"use client";

import SuperadminLayout from "../../../components/superadmin-layout";
import LedgerTable from "../../../components/ledger-table";

export default function SuperadminLedgerPage() {
  return (
    <SuperadminLayout active="ledger">
      <LedgerTable role="superadmin" />
    </SuperadminLayout>
  );
}
