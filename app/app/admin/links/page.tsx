import AdminLayout from "../../../components/admin-layout";
import QuickLinksPage from "../../../components/quick-links-page";

export default function AdminQuickLinksPage() {
  return (
    <AdminLayout active="links">
      <QuickLinksPage role="admin" />
    </AdminLayout>
  );
}
