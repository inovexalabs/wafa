"use client";

import AccountantLayout from "../../../components/accountant-layout";
import ReceiptsReview from "../../../components/receipts-review";

export default function AccountantReceiptsPage() {
  return (
    <AccountantLayout active="receipts">
      <ReceiptsReview role="accountant" />
    </AccountantLayout>
  );
}
