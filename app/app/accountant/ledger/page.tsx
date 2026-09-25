"use client";

import AccountantLayout from "../../../components/accountant-layout";
import LedgerTable from "../../../components/ledger-table";

export default function AccountantLedgerPage() {
  return (
    <AccountantLayout active="ledger">
      <LedgerTable role="accountant" />
    </AccountantLayout>
  );
}
