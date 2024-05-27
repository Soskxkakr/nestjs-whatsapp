import {
  MessageAck,
  MessageId,
  MessageMedia,
  ReactionList,
} from 'whatsapp-web.js';

interface User {
  readonly name: string;
  readonly profilePicUrl: string;
  readonly phoneNumber: string;
  readonly isMyContact: boolean;
}

export class MessageEntity {
  readonly id: MessageId | any;
  readonly hasMedia: boolean;
  readonly hasQuotedMessage: boolean;
  readonly quotedMessage: QuotedMessageEntity;
  attachment: MessageMedia | null;
  readonly thumbnail: string;
  readonly body: string;
  readonly type: string;
  readonly author: {
    name: string;
    pushname: string;
    shortName: string;
    isMyContact: boolean;
  };
  readonly from: User;
  readonly reactions: ReactionList[];
  // readonly mentions: Contact[];
  readonly to: string;
  readonly fromMe: boolean;
  readonly timestamp: number;
  readonly status: MessageAck;
}

export class QuotedMessageEntity {
  readonly id: MessageId | any;
  readonly hasMedia: boolean;
  readonly attachment: MessageMedia | null;
  readonly thumbnail: string;
  readonly body: string;
  readonly type: string;
  readonly to: string;
  readonly fromMe: boolean;
  readonly timestamp: number;
  readonly status: MessageAck;
}
