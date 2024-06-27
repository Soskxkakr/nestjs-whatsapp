import { Logger, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  useMultiFileAuthState,
  makeWASocket,
  makeInMemoryStore,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  proto,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import P from 'pino';
import { Boom } from '@hapi/boom';
import * as path from 'path';
import * as fs from 'fs';
import * as NodeCache from 'node-cache';
// import NodeCache from 'node-cache';

@WebSocketGateway({ cors: true })
export class Gateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;
  clients: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  sockets: Map<string, Socket> = new Map();
  stores: Map<string, ReturnType<typeof makeInMemoryStore>> = new Map();
  private logger = new Logger('Gateway');
  private pl = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` }).child(
    {},
  );

  onModuleInit() {
    this.server.on('connection', async (socket) => {
      try {
        const { sessionId } = socket.handshake.query;
        this.logger.log(`${sessionId} is connected.`);
        this.sockets.set(sessionId as string, socket);

        const { memoryStore, waSocket } = await this.initializeClient(
          sessionId as string,
        );
        this.clients.set(sessionId as string, waSocket);
        this.stores.set(sessionId as string, memoryStore);

        socket.on('disconnect', () => {
          this.logger.log(`Ending session for ${sessionId}`);
          // this.clients.get(sessionId as string).end(undefined);
          this.stores.delete(sessionId as string);
          this.clients.delete(sessionId as string);
          this.sockets.delete(sessionId as string);

          const sessionFilePath = path.join(
            process.cwd(),
            'store',
            `session-${sessionId}.json`,
          );
          fs.unlink(sessionFilePath, (err) => {
            if (err) {
              this.logger.error(
                `Error deleting session file for ${sessionId}:`,
                err,
              );
            } else {
              this.logger.log(
                `Session file for ${sessionId} deleted successfully.`,
              );
            }
          });
        });

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
    // Setting up store
    const memoryStore = makeInMemoryStore({});
    this.stores.set(sessionId, memoryStore);

    memoryStore?.readFromFile(`./store/session-${sessionId}.json`);
    setInterval(() => {
      this.logger.log('writing to store...');
      memoryStore?.writeToFile(`./store/session-${sessionId}.json`);
    }, 10_000);

    const socket = this.sockets.get(sessionId);
    this.pl.level = 'trace';

    const { state, saveCreds } = await useMultiFileAuthState(
      `keys/session-${sessionId}`,
    );
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const msgRetryCounterCache = new NodeCache();
    this.logger.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);
    const waSocket = makeWASocket({
      version,
      logger: this.pl,
      printQRInTerminal: true,
      // auth: state,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.pl),
      },
      msgRetryCounterCache,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
        let msg: proto.IWebMessageInfo;
        if (this.stores.get(sessionId)) {
          msg = await this.stores
            .get(sessionId)
            .loadMessage(key.remoteJid!, key.id!);
          return msg?.message || undefined;
        }

        return (msg?.message || undefined) as proto.IMessage | undefined;
      },
    });
    memoryStore.bind(waSocket.ev);

    waSocket.ev.process(async (events) => {
      if (events['connection.update']) {
        const { connection, qr, lastDisconnect } = events['connection.update'];
        if (qr) {
          socket.emit('onClientQr', {
            qrCode: qr,
          });
        }
        if (connection === 'close') {
          if (
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut
          ) {
            this.initializeClient(sessionId);
          } else {
            this.logger.log('Connection closed. You are logged out.');
          }
          this.logger.log('Connection closed ');
        }
        if (connection === 'open') {
          // this.clients.get(sessionId).process();
          socket.emit('onClientConnected', {
            msg: 'Client connected!',
          });
        }
      }

      if (events['creds.update']) {
        await saveCreds()
          .then(() => {
            this.logger.verbose('saving creds...');
          })
          .catch((err) => {
            this.logger.error(`error in saving creds: ${err}`);
          });
      }

      if (events['messages.upsert']) {
        const upsert = events['messages.upsert'];

        if (upsert.type === 'notify') {
          // this.logger.log('messages:', upsert.messages);
        }
      }

      if (events['messaging-history.set']) {
        const { isLatest } = events['messaging-history.set'];
        this.logger.log(`history set isLatest: ${isLatest}`);
      }

      if (events['chats.update']) {
        this.logger.verbose(events['chats.update']);
      }
    });

    return { memoryStore, waSocket };
  }
}
