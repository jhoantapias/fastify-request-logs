export interface PubSubPayload {
  message: Message;
}

interface Message {
  data: string;
  publishTime: string;
  messageId: string;
}
