import { Injectable } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { Chat, MessageTypes } from 'whatsapp-web.js';
import { MessageEntity } from './message.entity';

@Injectable()
export class MessageService {
  constructor(private readonly gateway: Gateway) {}

  async fetchMessages(body: Chat): Promise<MessageEntity[]> {
    let messageEntities: Promise<MessageEntity>[] = [];
    const chat = await this.gateway.client.getChatById(body.id._serialized);
    // TODO: Dynamic variable change for the limit
    const messages = await chat.fetchMessages({ limit: 100 });
    messageEntities = messages.map(async (message) => {
      if (message.type === MessageTypes.TEXT) {
        const contact = await message.getContact();
        let profilePicUrl: Promise<string> | string = '';
        if (!contact.isMe) {
          profilePicUrl = await contact.getProfilePicUrl();
        }
        return {
          id: message.id,
          hasMedia: message.hasMedia,
          body: message.body,
          type: message.type,
          from: {
            name: message.author || '',
            profilePicUrl: profilePicUrl,
            phoneNumber: contact.number,
            isMyContact: contact.isMyContact,
          },
          to: message.to,
          fromMe: message.fromMe,
          timestamp: message.timestamp,
          status: message.ack,
        };
      }
    });
    return Promise.all(messageEntities);
  }
}
