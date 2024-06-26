import { Controller, Get, Param } from '@nestjs/common';
import { Chat } from 'whatsapp-web.js';
import { ChatService } from './chat.service';
import { ChatEntity } from './chat.entity';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':sessionId')
  findAll(@Param('sessionId') sessionId: string): Promise<ChatEntity[]> {
    return this.chatService.findAll(sessionId);
  }

  @Get(':sessionId/:id')
  findById(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
  ): Promise<Chat> {
    return this.chatService.findById(id, sessionId);
  }
}
