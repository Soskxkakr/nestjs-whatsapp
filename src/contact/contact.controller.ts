import { Controller, Get, Param } from '@nestjs/common';
import { Contact } from 'whatsapp-web.js';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get(':sessionId')
  findAll(@Param('sessionId') sessionId: string): Promise<Contact[]> {
    return this.contactService.findAll(sessionId);
  }
}
