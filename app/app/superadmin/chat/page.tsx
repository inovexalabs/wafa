import SuperadminLayout from "../../../components/superadmin-layout";
import ChatPage from "../../../components/chat-page";

export default function SuperadminChatPage() {
  return (
    <SuperadminLayout active="chat">
      <ChatPage />
    </SuperadminLayout>
  );
}
