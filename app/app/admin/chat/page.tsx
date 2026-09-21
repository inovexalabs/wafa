import AdminLayout from "../../../components/admin-layout";
import ChatPage from "../../../components/chat-page";

export default function AdminChatPage() {
  return (
    <AdminLayout active="chat">
      <ChatPage />
    </AdminLayout>
  );
}
