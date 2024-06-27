import { Injectable } from '@nestjs/common';
import { Chat } from '@whiskeysockets/baileys';
import { ChatEntity } from 'src/chat/chat.entity';
import { Gateway } from 'src/gateway/gateway.socket';
import { UtilityService } from 'src/utils/utility.service';

@Injectable()
export class TransformerService {
  constructor(
    private readonly gateway: Gateway,
    private readonly utilityService: UtilityService,
  ) {}

  async transformToChatEntity(
    chat: Chat,
    sessionId: string,
  ): Promise<ChatEntity> {
    // Fetch profile picture URL
    const profilePicUrl = await this.utilityService
      .fetchWithTimeout(
        this.gateway.clients.get(sessionId).profilePictureUrl(chat.id),
        3000,
        '',
      )
      .catch(() => {
        return '';
      });

    // Fetch the recent message
    const recentMessage = await this.utilityService.fetchWithTimeout(
      this.gateway.stores.get(sessionId).mostRecentMessage(chat.id),
      3000,
      '',
    );

    const chatType =
      recentMessage?.message?.imageMessage ||
      recentMessage?.message?.videoMessage
        ? 'media'
        : recentMessage?.message?.stickerMessage
          ? 'sticker'
          : 'chat';

    const chatEntity: ChatEntity = {
      id: chat.id,
      phoneNumber: '', // TODO
      name: chat?.name || recentMessage.pushName,
      profilePicUrl,
      unreadCount: 0, // TODO
      lastMessage: recentMessage?.message?.conversation || '',
      type: chatType, // TODO
      status: 2, // TODO
      timestamp: recentMessage.messageTimestamp,
      author: {
        name: '', // TODO
        pushname: recentMessage.pushName,
        shortName: '', // TODO
        isMyContact: true, // TODO
        isMe: recentMessage.key.fromMe,
      },
      participants: [], // TODO
      fromMe: recentMessage.key.fromMe,
      isMe: false, // TODO
      isMyContact: true, // TODO
      isUser: true, // TODO
      isGroup: true, // TODO
    };

    return chatEntity;
  }
}
