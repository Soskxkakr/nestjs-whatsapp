import { Body, Controller, Post } from '@nestjs/common';
import { Chat } from 'whatsapp-web.js';
import { MessageService } from './message.service';
import { MessageEntity } from './message.entity';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  fetchMessages(@Body() body: Chat): Promise<MessageEntity[]> {
    return this.messageService.fetchMessages(body);
  }
}
