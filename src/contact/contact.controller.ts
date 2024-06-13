import { Controller, Get, Param, Post } from '@nestjs/common';
import { Contact } from 'whatsapp-web.js';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get(':sessionId')
  findAll(@Param('sessionId') sessionId: string): Promise<Contact[]> {
    return this.contactService.findAll(sessionId);
  }

  @Post('/syncContacts/:sessionId')
  syncContacts(
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean; rowsAffected?: number; error?: string }> {
    return this.contactService.syncContacts(sessionId);
  }
}
