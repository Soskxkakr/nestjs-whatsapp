import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { Chat, Location, Message, MessageMedia } from 'whatsapp-web.js';
import { MessageService } from './message.service';
import { MessageEntity } from './message.entity';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post(':sessionId')
  fetchMessages(
    @Body() body: Chat,
    @Param('sessionId') sessionId: string,
  ): Promise<MessageEntity[]> {
    return this.messageService.fetchMessages(body, sessionId);
  }

  @Post('/sendMessage/:sessionId')
  sendMessage(
    @Body()
    body: {
      chat: Chat;
      content: string | MessageMedia | Location;
      reply?: {
        messageId: string;
        message: string;
      };
      attachment?: MessageMedia;
    },
    @Param('sessionId') sessionId: string,
  ): Promise<Message> {
    return this.messageService.sendMessage(body, sessionId);
  }

  @Post('/react/:sessionId')
  reactMessage(
    @Body() body: { messageId: string; reaction: string },
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    return this.messageService.reactMessage(body, sessionId);
  }

  @Put('/deleteMessage/:sessionId')
  deleteMessage(
    @Body() body: { messageId: string },
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    return this.messageService.deleteMessage(body, sessionId);
  }
}
