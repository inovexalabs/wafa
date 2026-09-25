"use client";

import MemberLayout from "../../../components/member-layout";
import LedgerTable from "../../../components/ledger-table";

export default function MemberLedgerPage() {
  return (
    <MemberLayout active="ledger">
      <LedgerTable role="member" />
    </MemberLayout>
  );
}
