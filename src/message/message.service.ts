import { Injectable } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { Chat } from 'whatsapp-web.js';

@Injectable()
export class MessageService {
  fetchMessages(
    body: Chat,
    sessionId: string,
  ): Promise<import('./message.entity').MessageEntity[]> {
    throw new Error('Method not implemented.');
  }
  sendMessage(
    body: {
      chat: import('whatsapp-web.js').Chat;
      content:
        | string
        | import('whatsapp-web.js').MessageMedia
        | import('whatsapp-web.js').Location;
      reply?: { messageId: string; message: string };
      attachment?: import('whatsapp-web.js').MessageMedia;
    },
    sessionId: string,
  ): Promise<import('whatsapp-web.js').Message> {
    throw new Error('Method not implemented.');
  }
  reactMessage(
    body: { messageId: string; reaction: string },
    sessionId: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteMessage(body: { messageId: string }, sessionId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  constructor(private readonly gateway: Gateway) {}
}
