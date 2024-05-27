import { ChatId, GroupParticipant, MessageAck } from 'whatsapp-web.js';

export class ChatAuthor {
  readonly name: string;
  readonly pushname: string;
  readonly shortName: string;
  readonly isMyContact: boolean;
}

export class ChatEntity {
  readonly id: ChatId;
  readonly phoneNumber: string;
  readonly name: string;
  readonly profilePicUrl: any;
  readonly unreadCount: number;
  readonly lastMessage: string;
  readonly type: string;
  readonly status: MessageAck;
  readonly timestamp: number;
  readonly author: ChatAuthor;
  readonly participants: GroupParticipant[];
  readonly fromMe: boolean;
  readonly isMe: boolean;
  readonly isMyContact: boolean;
  readonly isUser: boolean;
  readonly isGroup: boolean;
}
