import { Injectable, Logger } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { DatabaseService } from 'src/common/database.service';
import { Chat } from '@whiskeysockets/baileys';
import { UtilityService } from 'src/utils/utility.service';

@Injectable()
export class ChatService {
  private logger = new Logger('Chat');
  constructor(
    private readonly gateway: Gateway,
    private readonly utilityService: UtilityService,
    private readonly databaseService: DatabaseService,
  ) {}

  async findAll(sessionId: string): Promise<any> {
    // let chatEntities: Promise<ChatEntity>[] = [];
    const chats: Chat[] = this.gateway.stores.get(sessionId).chats.all();
    // console.log('chats', chats);
    const newChats = chats
      .sort((a, b) => b.lastMessageRecvTimestamp - a.lastMessageRecvTimestamp)
      .slice(0, 10)
      .map(async (chat) => {
        const profilePicUrl = await this.utilityService
          .fetchWithTimeout(
            this.gateway.clients.get(sessionId).profilePictureUrl(chat.id),
            3000,
            '',
          )
          .catch(() => {
            return '';
          });

        const recentMessage = await this.utilityService.fetchWithTimeout(
          this.gateway.stores.get(sessionId).mostRecentMessage(chat.id),
          3000,
          '',
        );

        return {
          id: chat.id,
          profilePicUrl,
          recentMessage,
        };
      });

    return Promise.all(newChats);
  }

  async findById(id: string, sessionId: string): Promise<any> {
    return await this.gateway.stores.get(sessionId).loadMessages(id, 20);
  }
}
