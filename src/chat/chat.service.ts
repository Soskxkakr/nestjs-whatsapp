import { Injectable, Logger } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { Chat, GroupChat, MessageTypes } from 'whatsapp-web.js';
import { ChatEntity } from './chat.entity';
import { DatabaseService } from 'src/common/database.service';

@Injectable()
export class ChatService {
  private logger = new Logger('Chat');
  constructor(
    private readonly gateway: Gateway,
    private readonly databaseService: DatabaseService,
  ) {}

  async findAll(sessionId: string): Promise<ChatEntity[]> {
    let chatEntities: Promise<ChatEntity>[] = [];
    const client = await this.gateway.getClientState(sessionId, 3);
    this.logger.verbose(`${sessionId} fetching all chats...`);

    if (!client) return [];

    const chats = await this.gateway.clients
      .get(sessionId)
      .getChats()
      .then((chats: Chat[]) => {
        this.logger.verbose(`${sessionId} got all ${chats.length} chats`);
        return chats.sort((a, b) => b.timestamp - a.timestamp);
      })
      .catch((err) => {
        this.logger.error(`ERROR in fetching all chats: ${err}`);
        return [];
      });

    chatEntities = chats.slice(0, 15).map(async (chat: Chat) => {
      const contact = await chat.getContact().catch((err) => {
        this.logger.error(`ERROR in fetching contact information: ${err}`);
        return null;
      });

      if (!contact) return;

      const profilePicUrl = await this.gateway.clients
        .get(sessionId)
        .getProfilePicUrl(contact.id._serialized)
        .catch((err) => {
          this.logger.error(`ERROR in fetching profile picture: ${err}`);
          return '';
        });

      return {
        id: chat.id,
        phoneNumber: contact.number,
        name: chat.name,
        profilePicUrl,
        unreadCount: chat.unreadCount,
        lastMessage:
          chat.lastMessage?.type === MessageTypes.CIPHERTEXT
            ? 'Waiting for this message. Check your phone.'
            : chat.lastMessage?.body || '',
        type: chat.lastMessage?.type,
        status: chat.lastMessage?.ack,
        timestamp: chat.timestamp,
        author:
          contact.isGroup &&
          !chat.lastMessage?.fromMe &&
          chat?.lastMessage?.author
            ? (({ name, pushname, shortName, isMyContact, isMe }) => ({
                name,
                pushname,
                shortName,
                isMyContact,
                isMe,
              }))(
                await this.gateway.clients
                  .get(sessionId)
                  .getContactById(chat?.lastMessage?.author),
              )
            : null,
        participants: chat.isGroup
          ? await Promise.all(
              (chat as GroupChat).participants.map(async (participant) => ({
                ...participant,
                contact: (({
                  name,
                  pushname,
                  shortName,
                  isMyContact,
                  isMe,
                }) => ({
                  name,
                  pushname,
                  shortName,
                  isMyContact,
                  isMe,
                }))(
                  await this.gateway.clients
                    .get(sessionId)
                    .getContactById(participant.id._serialized),
                ),
              })),
            )
          : [],
        fromMe: chat.lastMessage?.fromMe,
        isMe: contact.isMe,
        isMyContact: contact.isMyContact,
        isUser: contact.isUser,
        isGroup: contact.isGroup,
      };
    });
    return Promise.all(chatEntities);
  }

  async findById(id: string, sessionId: string): Promise<Chat> {
    return this.gateway.clients.get(sessionId).getChatById(id);
  }
}
