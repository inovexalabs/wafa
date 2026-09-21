import AccountantLayout from "../../../components/accountant-layout";
import ChatPage from "../../../components/chat-page";

export default function AccountantChatPage() {
  return (
    <AccountantLayout active="chat">
      <ChatPage />
    </AccountantLayout>
  );
}
