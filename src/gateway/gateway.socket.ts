import { Logger, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuotedMessageEntity } from 'src/message/message.entity';
import {
  Client,
  LocalAuth,
  Message,
  // MessageMedia,
  MessageTypes,
} from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';

@WebSocketGateway({ cors: true })
export class Gateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;
  clients: Map<string, Client> = new Map();
  sockets: Map<string, Socket> = new Map();
  private logger = new Logger('Gateway');

  onModuleInit() {
    this.server.on('connection', async (socket) => {
      try {
        const { sessionId } = socket.handshake.query;
        this.logger.verbose(`${sessionId} is connected.`);

        socket.on('disconnect', async () => {
          this.logger.verbose(`${sessionId} has disconnected.`);
          // if (this.clients.has(sessionId as string)) {
          //   await this.onDisconnect(sessionId as string);
          // }
        });

        if (this.clients.has(sessionId as string)) {
          await this.onDisconnect(sessionId as string);
        }

        const client = new Client({
          authStrategy: new LocalAuth({
            clientId: sessionId as string,
            dataPath: `Session-${sessionId}`,
          }),
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--single-process',
              '--no-zygote',
              '--no-first-run',
              '--no-default-browser-check',
              '--disable-extensions',
              '--disable-default-apps',
              '--disable-sync',
              '--disable-translate',
              '--disable-web-security',
              '--disable-features=site-per-process',
              '--disable-infobars',
              '--window-position=0,0',
              '--ignore-certificate-errors',
              '--ignore-certificate-errors-spki-list',
              '--disable-gpu',
              '--disable-webgl',
              '--disable-threaded-animation',
              '--disable-threaded-scrolling',
              '--disable-in-process-stack-traces',
              '--disable-histogram-customizer',
              '--disable-gl-extensions',
              '--disable-composited-antialiasing',
              '--disable-canvas-aa',
              '--disable-3d-apis',
              '--disable-accelerated-2d-canvas',
              '--disable-accelerated-jpeg-decoding',
              '--disable-accelerated-mjpeg-decode',
              '--disable-app-list-dismiss-on-blur',
              '--disable-accelerated-video-decode',
            ],
          },
        });

        this.clients.set(sessionId as string, client);
        this.initializeClient(sessionId as string);
        this.sockets.set(sessionId as string, socket);
        this.logger.verbose(
          `Connected Clients: ${Array.from(this.clients.keys()).join(', ')}`,
        );
        this.logger.verbose(`Initializing ${sessionId}`);
      } catch (e) {
        this.logger.error(`ERROR in initializing: ${e}`);
      }
    });
  }

  private async initializeClient(sessionId: string) {
    await this.clients
      .get(sessionId)
      .initialize()
      .then(() => {
        this.logger.verbose(
          `${sessionId} initialized. Setting up listeners...`,
        );
        this.setupEventListeners(sessionId as string);
      })
      .catch(async (err) => {
        this.logger.error(`${sessionId} Failed to initialize: ${err}`);
        await this.onDisconnect(sessionId).then(async () => {
          this.logger.error(`${sessionId} re-initializing the client.`);
          await this.initializeClient(sessionId);
        });
      });
  }

  private setupEventListeners(sessionId: string) {
    const client = this.clients.get(sessionId);
    const socket = this.sockets.get(sessionId);

    client.on('qr', (qr) => {
      this.logger.verbose(`${sessionId} QR generated.`);
      socket.emit('onClientQr', {
        qrCode: qr,
      });
    });
    client.on('authenticated', () => {
      this.logger.verbose(`${sessionId} is authenticated.`);
      socket.emit('onAuthenticated', {
        msg: 'Client authenticated!',
      });
    });
    client.on('ready', () => {
      this.logger.verbose(`${sessionId} is ready.`);
      socket.emit('onClientConnected', {
        msg: 'Client connected!',
      });
    });
    client.on('loading_screen', (percent, message) => {
      this.logger.verbose(`${sessionId} loading ${percent} percent.`);
      socket.emit('onLoading', {
        percentage: percent,
        msg: message,
      });
    });
    client.on('change_state', (state) => {
      this.logger.verbose(`${sessionId} state changed to -> ${state}`);
    });
    client.on('remote_session_saved', () => {
      socket.emit('onRemoteSessionSaved', {
        msg: 'Remote session saved successfully.',
      });
    });
    client.on('disconnected', async () => {
      socket.emit('onClientDisconnected', {
        msg: 'Client has disconnected',
      });
      this.logger.verbose(`${sessionId} has removed from the linked devices.`);
      // await this.onDisconnect(sessionId).then(() => {
      //   fs.rmdir(path.join(__dirname, `Session-${sessionId}`), () => {
      //     this.logger.verbose(`Session-${sessionId} folder has been deleted.`);
      //   });
      // });
      await this.clients
        .get(sessionId)
        .logout()
        .then(() => {
          this.logger.verbose(`Session-${sessionId} has logged out.`);
        })
        .catch((err) => {
          this.logger.error(`Session-${sessionId} failed to logout: ${err}`);
        });
      fs.rm(
        path.join(path.join(__dirname, `Session-${sessionId}}`)),
        { recursive: true, force: true },
        (err) => {
          if (err) {
            this.logger.error(
              `Error deleting Session-${sessionId} folder: ${err}`,
            );
          } else {
            this.logger.verbose(
              `Session-${sessionId} folder has been deleted.`,
            );
          }
        },
      );
    });
    client.on('auth_failure', (message) => {
      this.logger.log(`${sessionId} auth failed: ${message}}`);
      socket.emit('onAuthFailure', {
        msg: message,
      });
    });
    client.on('message_create', async (message) => {
      if (message.body === '!resendmedia' && message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg.hasMedia) {
          const attachmentData = await quotedMsg.downloadMedia();
          this.clients
            .get(sessionId)
            .sendMessage(message.from, attachmentData, {
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
        const contact = await message.getContact().catch((err) => {
          this.logger.error(
            `${sessionId} failed in getting the contact information: ${err}`,
          );
          return null;
        });
        const chat = await message.getChat().catch((err) => {
          this.logger.error(`${sessionId} failed in getting the chat: ${err}`);
          return null;
        });

        if (!contact || !chat) return;

        const messageMedia = message.hasMedia
          ? await message.downloadMedia().catch((err) => {
              this.logger.error(`ERROR in downloading media ${err}`);
              return null;
            })
          : null;

        if (message.hasQuotedMsg) {
          const quote = await message.getQuotedMessage();
          const quotedMessageMedia = quote.hasMedia
            ? await quote.downloadMedia().catch((err) => {
                this.logger.error(`ERROR in downloading quoted media: ${err}`);
                return null;
              })
            : null;

          quotedMessage = {
            id: quote.id,
            hasMedia: quote.hasMedia,
            attachment: quotedMessageMedia,
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

        socket.emit('onMessageCreated', {
          id: message.id,
          hasMedia: message.hasMedia,
          hasQuotedMessage: message.hasQuotedMsg,
          quotedMessage: quotedMessage,
          attachment: messageMedia,
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
          chat: chat,
          isGroup: chat.isGroup,
          fromMe: message.fromMe,
          timestamp: message.timestamp,
          status: message.ack,
        });
      }
    });
    client.on('message_revoke_everyone', (_, revoked_msg) => {
      socket.emit('onMessageRevoked', {
        id: revoked_msg.id,
        from: revoked_msg.from,
        to: revoked_msg.to,
        timestamp: revoked_msg.timestamp,
        type: MessageTypes.REVOKED,
        body: revoked_msg.body,
      });
    });
    client.on('message_ack', (message, ack) => {
      socket.emit('onMessageAck', {
        message,
        ack,
      });
    });
    client.on('message_reaction', (reaction) => {
      socket.emit('onMessageReaction', reaction);
    });
  }

  private async onDisconnect(sessionId: string) {
    try {
      await this.clients
        .get(sessionId)
        .destroy()
        .then(() => {
          this.logger.verbose(`${sessionId} has been resetted.`);
          this.clients.delete(sessionId);
          this.sockets.delete(sessionId);
          this.logger.verbose(
            `Connected Clients: ${Array.from(this.clients.keys()).join(', ')}`,
          );
        })
        .catch((err) => {
          this.logger.error(`ERROR in resetting the state: ${err}`);
        });
    } catch (e) {
      this.logger.error(`ERROR in disconnecting the client: ${e}`);
      setTimeout(async () => {
        this.logger.log(`Retrying in 3 seconds...`);
        await this.onDisconnect(sessionId);
      }, 3000);
    }
  }

  async getClientState(
    sessionId: string,
    retries: number,
  ): Promise<Client | null> {
    try {
      const state = await this.clients.get(sessionId).getState();
      this.logger.debug(`${sessionId} state: ${state}`);

      if (state === 'CONNECTED') {
        return this.clients.get(sessionId);
      }

      this.logger.debug(
        `${sessionId} retrying to get client's connection in 2 seconds...`,
      );

      if (retries > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.getClientState(sessionId, retries - 1);
      } else {
        this.logger.warn(
          `${sessionId} has reached the maximum number of retries. Please restart your client.`,
        );
        return null;
      }
    } catch (err) {
      this.logger.error(
        `${sessionId} ERROR in getting connected client: ${err}`,
      );
      return null;
    }
  }
}
