import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  useMultiFileAuthState,
  makeWASocket,
  makeInMemoryStore,
} from '@whiskeysockets/baileys';
import { Logger, PinoLogger } from 'nestjs-pino';

@WebSocketGateway({ cors: true })
export class Gateway implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly pinoLogger: PinoLogger,
  ) {}

  @WebSocketServer()
  server: Server;
  clients: Map<string, any> = new Map();
  sockets: Map<string, Socket> = new Map();
  stores: Map<string, any> = new Map();

  onModuleInit() {
    this.server.on('connection', async (socket) => {
      try {
        const { sessionId } = socket.handshake.query;
        this.logger.log(`${sessionId} is connected.`);
        this.sockets.set(sessionId as string, socket);

        // Setting up store
        this.stores.set(sessionId as string, makeInMemoryStore({}));
        this.stores
          .get(sessionId as string)
          ?.readFromFile(`./store/session-${sessionId}.json`);
        setInterval(() => {
          this.stores
            .get(sessionId as string)
            ?.writeToFile(`./store/session-${sessionId}.json`);
        }, 10_000);

        const waClient = await this.initializeClient(sessionId as string);
        this.clients.set(sessionId as string, waClient);

        socket.on('disconnect', () => {
          this.logger.log(`Ending session for ${sessionId}`);
          this.clients.get(sessionId as string).end();
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
    const socket = this.sockets.get(sessionId);
    const { state: auth, saveCreds } = await useMultiFileAuthState(
      `keys/session-${sessionId}`,
    );
    const waSocket = makeWASocket({ auth });
    this.stores.get(sessionId).bind(waSocket.ev);

    waSocket.ev.process(async (events) => {
      if (events['connection.update']) {
        const { connection, qr } = events['connection.update'];
        if (qr) {
          socket.emit('onClientQr', {
            qrCode: qr,
          });
        }
        if (connection === 'close') {
          this.initializeClient(sessionId);
        }
        if (connection === 'open') {
          socket.emit('onClientConnected', {
            msg: 'Client connected!',
          });
        }
      }

      if (events['creds.update']) await saveCreds();

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
    });

    return waSocket;
  }

  private setupEventListeners() {}
}
