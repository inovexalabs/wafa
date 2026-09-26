import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
