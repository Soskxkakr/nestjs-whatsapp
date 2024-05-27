import { Injectable } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import {
  Chat,
  Location,
  Message,
  MessageMedia,
  MessageTypes,
} from 'whatsapp-web.js';
import { MessageEntity, QuotedMessageEntity } from './message.entity';

@Injectable()
export class MessageService {
  constructor(private readonly gateway: Gateway) {}

  async sendMessage(body: {
    chat: Chat;
    content: string | MessageMedia | Location;
    reply?: {
      messageId: string;
      message: string;
    };
    attachment?: MessageMedia;
  }): Promise<Message> {
    if (body.reply) {
      const message = await this.gateway.client.getMessageById(
        body.reply.messageId,
      );
      return message.reply(body.content, body.chat.id._serialized, {
        quotedMessageId: message.id.id,
      });
    }

    const whatsappChat = await this.gateway.client.getChatById(
      body.chat.id._serialized,
    );

    if (body.attachment) {
      this.gateway.client.sendMessage(
        whatsappChat.id._serialized,
        body.attachment,
        {
          caption: body.content as string,
        },
      );
    }

    return whatsappChat.sendMessage(body.content);
  }

  async reactMessage(body: { messageId: string; reaction: string }) {
    const message = await this.gateway.client.getMessageById(body.messageId);
    return await message.react(body.reaction);
  }

  async deleteMessage(body: { messageId: string }) {
    const message = await this.gateway.client.getMessageById(body.messageId);
    return await message.delete(true);
  }

  async fetchMessages(body: Chat): Promise<MessageEntity[]> {
    let messageEntities: Promise<MessageEntity>[] = [];
    let messageEntity: MessageEntity;
    let quotedMessage: QuotedMessageEntity = null;

    const chat = await this.gateway.client.getChatById(body.id._serialized);
    await chat.sendSeen();
    // this.gateway.setupMessageEventListeners();

    // TODO: Dynamic variable change for the limit
    const messages = await chat.fetchMessages({ limit: 10 });
    messageEntities = messages.map(async (message) => {
      if (
        [
          MessageTypes.IMAGE,
          MessageTypes.VIDEO,
          MessageTypes.TEXT,
          MessageTypes.REVOKED,
          MessageTypes.STICKER,
          MessageTypes.DOCUMENT,
        ].includes(message.type)
      ) {
        if (message.id.id === 'DE597DB757F53C0C8150B04542E2D43D') {
          console.log('messagee', message);
        }
        const contact = await message.getContact();

        // Fixing cache issue only for Video type of message
        // if (
        //   [
        //     MessageTypes.VIDEO,
        //     MessageTypes.IMAGE,
        //     MessageTypes.STICKER,
        //   ].includes(message.type)
        // ) {
        //   rawData = message.rawData as Message;
        //   attachment = await this.fetchMessageMedia(message);
        // }

        if (message.hasQuotedMsg) {
          const quote = await message.getQuotedMessage();

          // Fixing cache issue for quoted message attachment media
          // if (
          //   [
          //     MessageTypes.VIDEO,
          //     MessageTypes.IMAGE,
          //     MessageTypes.STICKER,
          //   ].includes(quote.type)
          // ) {

          // }

          quotedMessage = {
            id: quote.id,
            hasMedia: quote.hasMedia,
            attachment: quote.hasMedia ? await quote.downloadMedia() : null,
            thumbnail: quote.hasMedia
              ? (quote.rawData as Message).body || ''
              : '',
            body: quote.body,
            type: quote.type,
            to: quote.to,
            fromMe: quote.fromMe,
            timestamp: quote.timestamp,
            status: quote.ack,
          };
        }

        messageEntity = {
          id: message.id,
          hasMedia: message.hasMedia,
          hasQuotedMessage: message.hasQuotedMsg,
          quotedMessage: quotedMessage,
          attachment: message.hasMedia ? await message.downloadMedia() : null,
          thumbnail: message.hasMedia
            ? (message.rawData as Message).body || ''
            : '',
          body: message.body,
          type: message.type,
          author: (({ name, pushname, shortName, isMyContact }) => ({
            name,
            pushname,
            shortName,
            isMyContact,
          }))(contact),
          reactions: (await message.getReactions()) || [],
          from: {
            name: message.author || '',
            profilePicUrl: !contact.isMe
              ? await contact.getProfilePicUrl()
              : null,
            phoneNumber: contact.number,
            isMyContact: contact.isMyContact,
          },
          to: message.to,
          fromMe: message.fromMe,
          timestamp: message.timestamp,
          status: message.ack,
        };

        if (message.type === 'video') {
          console.log(await message.downloadMedia());
        }

        return messageEntity;
      }
    });
    return Promise.all(messageEntities);
  }

  async fetchMessageMedia(message: Message): Promise<MessageMedia> {
    const newMessage = await this.gateway.client.getMessageById(
      message.id._serialized,
    );
    if (newMessage.hasMedia) return await newMessage.downloadMedia();
    return null;
  }
}
