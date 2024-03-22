import { ChatId } from 'whatsapp-web.js';

export class ChatEntity {
  readonly id: ChatId;
  readonly phoneNumber: string;
  readonly name: string;
  readonly profilePicUrl: any;
  readonly unreadCount: number;
  readonly lastMessage: string;
  readonly timestamp: number;
  readonly isMe: boolean;
  readonly isMyContact: boolean;
  readonly isUser: boolean;
  readonly isGroup: boolean;
}
