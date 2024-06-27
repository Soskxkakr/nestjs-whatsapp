import { Injectable } from '@nestjs/common';
import {
  Chat,
  GroupMetadata,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import Long from 'long';
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
    let groupMetadata: GroupMetadata;
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

    const chatType = recentMessage?.message?.imageMessage
      ? 'image'
      : recentMessage?.message?.videoMessage
        ? 'video'
        : recentMessage?.message?.stickerMessage
          ? 'sticker'
          : recentMessage?.messageStubType === 1
            ? 'revoked'
            : 'chat';

    const contact = Object.values(
      this.gateway.stores.get(sessionId).contacts,
    ).find((c) => c.id === chat.id);

    const isGroup = !!contact.name;

    if (isGroup) {
      groupMetadata = await this.gateway.clients
        .get(sessionId)
        .groupMetadata(chat.id);
    }

    if (chat.id === '60169660748@s.whatsapp.net') {
      console.log('chat', chat);
      console.log('recentMessage', recentMessage?.message?.stickerMessage);
      // console.log(
      //   'recentMessage',
      //   downloadMediaMessage(recentMessage, 'buffer', {}),
      // );
    }

    const chatEntity: ChatEntity = {
      id: chat.id,
      phoneNumber: chat.id.split('@')[0] || '',
      name: isGroup
        ? groupMetadata.subject
        : contact?.notify || `+${chat.id.split('@')[0]}`,
      profilePicUrl,
      unreadCount: chat.unreadCount,
      lastMessage:
        recentMessage?.message?.conversation ||
        recentMessage?.message?.extendedTextMessage?.text ||
        recentMessage?.message?.templateMessage?.hydratedTemplate
          ?.hydratedContentText ||
        '',
      type: chatType, // IMPROVE
      status: 2, // TODO
      // timestamp:
      //   (recentMessage.messageTimestamp as Long)?.low ||
      //   recentMessage.messageTimestamp,
      timestamp:
        (chat.conversationTimestamp as Long)?.low || chat.conversationTimestamp,
      author: {
        name: '', // TODO
        pushname:
          Object.values(this.gateway.stores.get(sessionId).contacts).find(
            (c) => c.id === recentMessage.participant,
          )?.notify ||
          recentMessage.pushName ||
          '',
        shortName: '', // TODO
        isMyContact: true, // TODO
        isMe: recentMessage.key.fromMe,
      },
      participants: isGroup ? groupMetadata.participants : [],
      fromMe: recentMessage.key.fromMe,
      isMe: this.gateway.clients.get(sessionId).user.id === chat.id,
      isMyContact: true, // TODO
      isUser: true, // TODO
      isGroup,
    };

    return chatEntity;
  }
}
