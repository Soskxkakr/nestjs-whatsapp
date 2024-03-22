import { Injectable } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { Chat } from 'whatsapp-web.js';
import { ChatEntity } from './chat.entity';

@Injectable()
export class ChatService {
  constructor(private readonly gateway: Gateway) {}

  async findAll(): Promise<ChatEntity[]> {
    let chatEntities: Promise<ChatEntity>[] = [];
    const chats = await this.gateway.client.getChats();

    chatEntities = chats.map(async (chat) => {
      const contact = await chat.getContact();
      return {
        id: chat.id,
        phoneNumber: contact.number,
        name: chat.name,
        profilePicUrl: await contact.getProfilePicUrl(),
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage.body || '',
        timestamp: chat.timestamp,
        isMe: contact.isMe,
        isMyContact: contact.isMyContact,
        isUser: contact.isUser,
        isGroup: contact.isGroup,
      };
    });

    return Promise.all(chatEntities);
  }

  async findById(id: string): Promise<Chat> {
    return this.gateway.client.getChatById(id);
  }
}
