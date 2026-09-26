import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Member Dashboard",
};

export default function MemberSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
