import AccountantLayout from "../../../components/accountant-layout";
import QuickLinksPage from "../../../components/quick-links-page";

export default function AccountantQuickLinksPage() {
  return (
    <AccountantLayout active="links">
      <QuickLinksPage role="accountant" />
    </AccountantLayout>
  );
}
