import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Superadmin Dashboard",
};

export default function SuperadminSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
