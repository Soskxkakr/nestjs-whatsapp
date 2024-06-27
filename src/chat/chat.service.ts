import { Injectable, Logger } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { DatabaseService } from 'src/common/database.service';
import { Chat, proto } from '@whiskeysockets/baileys';
import { TransformerService } from 'src/transformer/transformer.service';
import { UtilityService } from 'src/utils/utility.service';

@Injectable()
export class ChatService {
  private logger = new Logger('Chat');
  constructor(
    private readonly gateway: Gateway,
    private readonly databaseService: DatabaseService,
    private readonly transformerService: TransformerService,
    private readonly utilityService: UtilityService,
  ) {}

  async findAll(sessionId: string): Promise<any> {
    const chats = this.gateway.stores.get(sessionId).chats.all();
    const newChats = chats
      .filter(
        (chat) =>
          chat.id !== 'status@broadcast' && chat.id !== '0@s.whatsapp.net',
      )
      .filter((chat) => chat.messages)
      .filter(
        (chat) => chat?.messages[0]?.message?.status?.toString() !== 'PENDING',
      )
      // .sort((a, b) => b.lastMessageRecvTimestamp - a.lastMessageRecvTimestamp)
      // .slice(0, 15)
      .map(async (chat) => {
        // const recentMessage = await this.utilityService.fetchWithTimeout(
        //   this.gateway.stores.get(sessionId).mostRecentMessage(chat.id),
        //   3000,
        //   '',
        // );
        // this.gateway.stores.get(sessionId).contacts;
        // await this.gateway.clients
        //   .get(sessionId)
        //   .readMessages([recentMessage.key]);
        // return recentMessage;
        // return { id: chat.id, status:  };
        // return chat;
        return this.transformerService.transformToChatEntity(chat, sessionId);
      });

    // return Promise.all(newChats);
    return (await Promise.all(newChats)).sort(
      (a, b) => (b.timestamp as number) - (a.timestamp as number),
    );
  }

  async findById(id: string, sessionId: string): Promise<any> {
    return await this.gateway.stores
      .get(sessionId)
      .loadMessages(id, 20, { before: {}, after: {} });
  }
}
