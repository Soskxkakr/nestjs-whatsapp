import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { QuotedMessageEntity } from 'src/message/message.entity';
import {
  Client,
  LocalAuth,
  Message,
  MessageMedia,
  MessageTypes,
} from 'whatsapp-web.js';

@WebSocketGateway({ cors: true })
export class Gateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;
  client: Client;

  onModuleInit() {
    this.server.on('connection', async (socket) => {
      if (!!this.client) await this.client.destroy();

      const { sessionId } = socket.handshake.query;
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: `Session-${sessionId}`,
        }),
        webVersionCache: {
          type: 'remote',
          remotePath:
            'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
        },
        puppeteer: {
          headless: true,
          args: ['--no-sandbox'],
        },
      });
      this.setupEventListeners();
      this.client.initialize();
    });
  }

  setupEventListeners() {
    this.client.on('qr', (qr) => {
      this.server.emit('onClientQr', {
        qrCode: qr,
      });
    });
    this.client.once('ready', async () => {
      console.log('Client is ready');
      this.server.emit('onClientConnected', {
        msg: 'Client connected!',
      });
    });
    this.client.on('loading_screen', (percent, message) => {
      this.server.emit('onLoading', {
        percentage: percent,
        msg: message,
      });
    });
    this.client.once('disconnected', () => {
      this.server.emit('onClientDisconnected', {
        msg: 'Client has disconnected',
      });
    });
    this.client.on('auth_failure', (message) => {
      this.server.emit('onAuthFailure', {
        msg: message,
      });
    });
    this.client.on('error', (error) => {
      this.server.emit('onError', {
        msg: error,
      });
    });
    this.client.on('message_create', async (message) => {
      if (message.body === '!resendmedia' && message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg.hasMedia) {
          const attachmentData = await quotedMsg.downloadMedia();
          console.log(attachmentData);
          this.client.sendMessage(message.from, attachmentData, {
            caption: "Here's your requested media.",
          });
        }
      } else if (message.body === '!mediainfo' && message.hasMedia) {
        const attachmentData = await message.downloadMedia();
        message.reply(`
            *Media info*
            MimeType: ${attachmentData.mimetype}
            Filename: ${attachmentData.filename}
            Data (length): ${attachmentData.data.length}
        `);
      }
      let quotedMessage: QuotedMessageEntity = null;

      if (
        [
          MessageTypes.IMAGE,
          MessageTypes.VIDEO,
          MessageTypes.TEXT,
          MessageTypes.STICKER,
          MessageTypes.DOCUMENT,
        ].includes(message.type)
      ) {
        const contact = await message.getContact();
        const chat = await message.getChat();

        // Fixing cache issue only for message attachment media
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
          //   quotedRawData = quote.rawData as Message;
          //   quotedAttachment = await this.fetchMessageMedia(quote);
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

        this.server.emit('onMessageCreated', {
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
          author: (({ name, pushname, shortName, isMyContact, isMe }) => ({
            name,
            pushname,
            shortName,
            isMyContact,
            isMe,
          }))(contact),
          from: {
            name: message.author || '',
            profilePicUrl: !message.fromMe
              ? await contact.getProfilePicUrl()
              : null,
            phoneNumber: contact.number,
            isMyContact: contact.isMyContact,
          },
          to: message.to,
          isGroup: chat.isGroup,
          fromMe: message.fromMe,
          timestamp: message.timestamp,
          status: message.ack,
        });
      }
    });
    this.client.on('message_revoke_everyone', (_, revoked_msg) => {
      this.server.emit('onMessageRevoked', {
        id: revoked_msg.id,
        from: revoked_msg.from,
        to: revoked_msg.to,
        timestamp: revoked_msg.timestamp,
        type: MessageTypes.REVOKED,
        body: revoked_msg.body,
      });
    });
    this.client.on('message_ack', (message, ack) => {
      this.server.emit('onMessageAck', {
        message,
        ack,
      });
    });
    this.client.on('message_reaction', (reaction) => {
      this.server.emit('onMessageReaction', reaction);
    });
  }

  // setupMessageEventListeners() {
  //   let attachment: MessageMedia = null;
  //   let profilePicUrl: string = '';
  //   let quotedMessage: QuotedMessageEntity = null;
  //   let rawData: Message;

  //   this.client.on('message', async (message) => {
  //     console.log('listening to messages now...');
  //     if (
  //       [MessageTypes.IMAGE, MessageTypes.VIDEO, MessageTypes.TEXT].includes(
  //         message.type,
  //       )
  //     ) {
  //       const contact = await message.getContact();

  //       // Fixing cache issue only for Video type of message
  //       if ([MessageTypes.VIDEO, MessageTypes.IMAGE].includes(message.type)) {
  //         rawData = message.rawData as Message;
  //         attachment = await this.fetchMessageMedia(message);
  //       }

  //       if (!contact.isMe) {
  //         profilePicUrl = await contact.getProfilePicUrl();
  //       }

  //       if (message.hasQuotedMsg) {
  //         const quote = await message.getQuotedMessage();
  //         let quotedRawData: Message;
  //         let quotedAttachment: MessageMedia = null;

  //         // Fixing cache issue for quoted message attachment media
  //         if ([MessageTypes.VIDEO, MessageTypes.IMAGE].includes(quote.type)) {
  //           quotedRawData = quote.rawData as Message;
  //           quotedAttachment = await this.fetchMessageMedia(quote);
  //         }

  //         quotedMessage = {
  //           id: quote.id,
  //           hasMedia: quote.hasMedia,
  //           attachment: quotedAttachment,
  //           thumbnail: quotedRawData.body,
  //           body: quote.body,
  //           type: quote.type,
  //           to: quote.to,
  //           fromMe: quote.fromMe,
  //           timestamp: quote.timestamp,
  //           status: quote.ack,
  //         };
  //       }

  //       console.log('emitting message!');

  //       this.server.emit('onMessageReceived', {
  //         id: message.id,
  //         hasMedia: message.hasMedia,
  //         hasQuotedMessage: message.hasQuotedMsg,
  //         quotedMessage: quotedMessage,
  //         attachment,
  //         thumbnail: message.hasMedia ? rawData?.body || '' : '',
  //         body: message.body,
  //         type: message.type,
  //         from: {
  //           name: message.author || '',
  //           profilePicUrl: profilePicUrl,
  //           phoneNumber: contact.number,
  //           isMyContact: contact.isMyContact,
  //         },
  //         to: message.to,
  //         fromMe: message.fromMe,
  //         timestamp: message.timestamp,
  //         status: message.ack,
  //       });
  //     }
  //   });
  // }

  async fetchMessageMedia(message: Message): Promise<MessageMedia> {
    const newMessage = await this.client.getMessageById(message.id._serialized);
    if (newMessage.hasMedia) return await newMessage.downloadMedia();
    return null;
  }
}
