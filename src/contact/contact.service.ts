import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/common/database.service';
import { Gateway } from 'src/gateway/gateway.socket';

@Injectable()
export class ContactService {
  findAll(sessionId: string): Promise<import('whatsapp-web.js').Contact[]> {
    throw new Error('Method not implemented.');
  }
  syncContacts(
    sessionId: string,
  ): Promise<{ success: boolean; rowsAffected?: number; error?: string }> {
    throw new Error('Method not implemented.');
  }
  private logger = new Logger('Contact');
  constructor(
    private readonly gateway: Gateway,
    private readonly databaseService: DatabaseService,
  ) {}
}
