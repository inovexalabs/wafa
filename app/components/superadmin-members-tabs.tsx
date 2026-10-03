import Link from "next/link";

const tabs = [
  ["directory", "Members", "/superadmin/members"],
  ["document-types", "Document types", "/superadmin/members/document-types"],
] as const;

export default function SuperadminMembersTabs({ active }: { active: (typeof tabs)[number][0] }) {
  return (
    <nav className="flex gap-[22px] border-b border-[#e4ebe6]" aria-label="Members sections">
      {tabs.map(([key, label, href]) => (
        <Link
          key={key}
          href={href}
          className={
            "border-b-2 pb-[11px] text-[12px] no-underline " +
            (active === key ? "border-[#287257] text-[#24634e] font-bold" : "border-transparent text-[#8b9992] hover:text-[#24634e]")
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
