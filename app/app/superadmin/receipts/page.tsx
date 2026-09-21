"use client";

import SuperadminLayout from "../../../components/superadmin-layout";
import ReceiptsReview from "../../../components/receipts-review";

export default function SuperadminReceiptsPage() {
  return (
    <SuperadminLayout active="receipts">
      <ReceiptsReview role="superadmin" />
    </SuperadminLayout>
  );
}
