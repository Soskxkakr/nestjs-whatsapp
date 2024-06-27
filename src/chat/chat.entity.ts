export class ChatAuthor {
  readonly name: string;
  readonly pushname: string;
  readonly shortName: string;
  readonly isMyContact: boolean;
  readonly isMe: boolean;
}

export class ChatEntity {
  readonly id: string;
  readonly phoneNumber: string;
  readonly name: string;
  readonly profilePicUrl: any;
  readonly unreadCount: number;
  readonly lastMessage: string;
  readonly type: string;
  readonly status: any;
  readonly timestamp: number | Long;
  readonly author: ChatAuthor;
  readonly participants: any[];
  readonly fromMe: boolean;
  readonly isMe: boolean;
  readonly isMyContact: boolean;
  readonly isUser: boolean;
  readonly isGroup: boolean;
}
