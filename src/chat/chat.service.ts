import { Injectable, Logger } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { Chat, GroupChat, MessageTypes } from 'whatsapp-web.js';
import { ChatEntity } from './chat.entity';
import { DatabaseService } from 'src/common/databse.service';

@Injectable()
export class ChatService {
  private logger = new Logger('Chat');
  constructor(
    private readonly gateway: Gateway,
    private readonly databaseService: DatabaseService,
  ) {}

  async findAll(sessionId: string): Promise<ChatEntity[]> {
    let chatEntities: Promise<ChatEntity>[] = [];
    this.logger.verbose(`${sessionId} fetching all chats...`);
    const chats = await this.gateway.clients
      .get(sessionId)
      .getChats()
      .then((chats: Chat[]) => {
        this.logger.debug(`${sessionId} got all ${chats.length} chats`);
        return chats.sort((a, b) => b.timestamp - a.timestamp);
      })
      .catch((err) => {
        this.logger.error(`ERROR in fetching all chats: ${err}`);
        return [];
      });

    chatEntities = chats.slice(0, 15).map(async (chat: Chat) => {
      const contact = await chat.getContact();
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

  // async syncAllChats() {
  //   const chats = await this.gateway.client.getChats();
  //   const chatEntities = chats.map(async (chat) => {
  //     const contact = await chat.getContact();
  //     return {
  //       id: chat.id,
  //       phoneNumber: contact.number,
  //       name: chat.name,
  //       profilePicUrl: await contact.getProfilePicUrl(),
  //       unreadCount: chat.unreadCount,
  //       lastMessage: chat.lastMessage?.body || '',
  //       timestamp: chat.timestamp,
  //       isMe: contact.isMe,
  //       isMyContact: contact.isMyContact,
  //       isUser: contact.isUser,
  //       isGroup: contact.isGroup,
  //     } as ChatEntity;
  //   });

  //   const realChats = await Promise.all(chatEntities);
  //   const values = realChats.map((realChat) => {
  //     // return `('${realChat.id._serialized}', '${realChat.name}', '${realChat.phoneNumber}', '${realChat.profilePicUrl}', ${realChat.unreadCount}, '${realChat.lastMessage}', '${new Date(realChat.timestamp).toISOString()}', ${realChat.isMe ? 1 : 0}, ${realChat.isMyContact ? 1 : 0}, ${realChat.isUser ? 1 : 0}, ${realChat.isGroup ? 1 : 0})`;
  //     return `('${realChat.id._serialized}', '${realChat.name}', '${realChat.phoneNumber}', 'https:\/\/pps.whatsapp.net/v/t61.24694-24/342235661_695917945669158_5932808463367197920_n.jpg?ccb=11-4&oh=01_ASDiKOvwOu2CBf-eKNqKVUSU9nqDSe_x_ekSOcAXPwlTPA&oe=6620ABEF&_nc_sid=e6ed6c&_nc_cat=107', ${realChat.unreadCount}, '${realChat.lastMessage}', '${new Date(realChat.timestamp).toISOString()}', ${realChat.isMe ? 1 : 0}, ${realChat.isMyContact ? 1 : 0}, ${realChat.isUser ? 1 : 0}, ${realChat.isGroup ? 1 : 0})`;
  //   });
  //   // console.log(`INSERT INTO em255.WhatsAppChats
  //   // (ChatID, Name, PhoneNumber, ProfilePictureUrl, UnreadCount, LastMessage, Timestamp, IsMe, IsMyContact, IsUser, IsGroup) VALUES
  //   // ${values.join(', ')}`);

  //   const result = await this.databaseService.executeQuery(
  //     `INSERT INTO em255.WhatsAppChats
  //     (ChatID, [Name], PhoneNumber, ProfilePictureUrl, UnreadCount, LastMessage, [Timestamp], IsMe, IsMyContact, IsUser, IsGroup) VALUES
  //     ${values.join(', ')}`,
  //   );
  //   console.log('hihi', result);
  // }
}
