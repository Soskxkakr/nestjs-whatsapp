import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { MessageMedia } from 'whatsapp-web.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FileService } from './file.service';
import { ConfigService } from '@nestjs/config';
import { BlobSASPermissions, BlobServiceClient } from '@azure/storage-blob';

@Controller('file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private configService: ConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<MessageMedia> {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      this.configService.get<string>('CONTAINER_CONNECTION_STRING'),
    );
    const containerClient = blobServiceClient.getContainerClient(
      this.configService.get<string>('CONTAINER_NAME'),
    );
    await containerClient.setAccessPolicy('container');
    const blockBlobClient = containerClient.getBlockBlobClient(
      `${Date.now()}-${file.originalname}`,
    );

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const url = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(new Date().valueOf() + 60 * 60 * 1000),
      permissions: BlobSASPermissions.parse('r'),
    });

    return this.fileService.upload(url);
  }
}
