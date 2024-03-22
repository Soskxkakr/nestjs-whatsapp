import { Controller, Get, Param } from '@nestjs/common';
import { Chat } from 'whatsapp-web.js';
import { ChatService } from './chat.service';
import { ChatEntity } from './chat.entity';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findAll(): Promise<ChatEntity[]> {
    return this.chatService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Chat> {
    console.log('HERE!', id);
    return this.chatService.findById(id);
  }
}
