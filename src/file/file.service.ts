import { Injectable } from '@nestjs/common';
import { Gateway } from 'src/gateway/gateway.socket';
import { MessageMedia } from 'whatsapp-web.js';

@Injectable()
export class FileService {
  constructor(private readonly gateway: Gateway) {}

  async upload(url: string): Promise<MessageMedia> {
    // return MessageMedia.fromFilePath(url);
    return await MessageMedia.fromUrl(url);
  }
}
