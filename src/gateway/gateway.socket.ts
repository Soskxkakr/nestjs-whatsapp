import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Client, LocalAuth } from 'whatsapp-web.js';

@WebSocketGateway({ cors: true })
export class Gateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;
  client: Client;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      const { sessionId } = socket.handshake.query;
      console.log('Connected ', sessionId);
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: `Session-${sessionId}`,
        }),
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
    this.client.once('ready', () => {
      console.log('Ready');
      this.server.emit('onClientConnected', {
        msg: 'Client connected!',
      });
    });
    this.client.on('loading_screen', (percent, message) => {
      console.log('Loading');
      this.server.emit('onLoading', {
        percentage: percent,
        msg: message,
      });
    });
    this.client.once('disconnected', () => {
      console.log('Disconnected');
      this.server.emit('onClientDisconnected', {
        msg: 'Client has disconnected',
      });
    });
    this.client.on('auth_failure', (message) => {
      console.log('Failed');
      this.server.emit('onAuthFailure', {
        msg: message,
      });
    });
    this.client.on('message', (message) => {
      console.log('message received', message);
      this.server.emit('onMessageReceived', {
        msg: message,
      });
    });
    this.client.on('error', (error) => {
      console.log('error', error);
      this.server.emit('onError', {
        msg: error,
      });
    });
  }
}
