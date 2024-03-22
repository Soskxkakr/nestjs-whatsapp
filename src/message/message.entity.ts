import { MessageAck, MessageId } from 'whatsapp-web.js';

interface User {
  readonly name: string;
  readonly profilePicUrl: string;
  readonly phoneNumber: string;
  readonly isMyContact: boolean;
}

export class MessageEntity {
  readonly id: MessageId | any;
  readonly hasMedia: boolean;
  readonly body: string;
  readonly type: string;
  readonly from: User;
  readonly to: string;
  readonly fromMe: boolean;
  readonly timestamp: number;
  readonly status: MessageAck;
}
