import MemberLayout from "../../../components/member-layout";
import ChatPage from "../../../components/chat-page";

export default function MemberChatPage() {
  return (
    <MemberLayout active="chat">
      <ChatPage />
    </MemberLayout>
  );
}
