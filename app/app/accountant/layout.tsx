import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Accountant Dashboard",
};

export default function AccountantSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
