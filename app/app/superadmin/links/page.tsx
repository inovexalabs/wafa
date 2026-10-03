import SuperadminLayout from "../../../components/superadmin-layout";
import QuickLinksPage from "../../../components/quick-links-page";

export default function SuperadminQuickLinksPage() {
  return (
    <SuperadminLayout active="links">
      <QuickLinksPage role="superadmin" />
    </SuperadminLayout>
  );
}
