import MemberLayout from "../../../components/member-layout";
import QuickLinksPage from "../../../components/quick-links-page";

export default function MemberQuickLinksPage() {
  return (
    <MemberLayout active="links">
      <QuickLinksPage role="member" />
    </MemberLayout>
  );
}
