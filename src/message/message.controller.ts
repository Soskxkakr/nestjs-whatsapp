import { Body, Controller, Post, Put } from '@nestjs/common';
import { Chat, Location, Message, MessageMedia } from 'whatsapp-web.js';
import { MessageService } from './message.service';
import { MessageEntity } from './message.entity';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  fetchMessages(@Body() body: Chat): Promise<MessageEntity[]> {
    return this.messageService.fetchMessages(body);
  }

  @Post('/sendMessage')
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
  ): Promise<Message> {
    return this.messageService.sendMessage(body);
  }

  @Post('/react')
  reactMessage(
    @Body() body: { messageId: string; reaction: string },
  ): Promise<void> {
    return this.messageService.reactMessage(body);
  }

  @Put('/deleteMessage')
  deleteMessage(@Body() body: { messageId: string }): Promise<void> {
    return this.messageService.deleteMessage(body);
  }
}
