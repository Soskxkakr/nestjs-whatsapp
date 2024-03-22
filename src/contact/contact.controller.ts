import { Controller, Get } from '@nestjs/common';
import { Contact } from 'whatsapp-web.js';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}
  @Get()
  findAll(): Promise<Contact[]> {
    return this.contactService.findAll();
  }
}
