import { Injectable } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { Contact } from 'whatsapp-web.js';

@Injectable()
export class ContactService {
  constructor(private readonly gateway: Gateway) {}

  async findAll(sessionId: string): Promise<Contact[]> {
    return this.gateway.clients.get(sessionId).getContacts();
  }
}
