import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

@Injectable()
export class DatabaseService {
  constructor(private configService: ConfigService) {}

  async executeQuery(query: string): Promise<any> {
    try {
      const pool = await new sql.ConnectionPool({
        server: this.configService.get<string>('DB_HOST'),
        user: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_NAME'),
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      }).connect();

      const result = await pool.request().query(query);
      // const result = await request.query(query);
      await pool.close();
      return result;
    } catch (error) {
      throw error;
    }
  }
}
