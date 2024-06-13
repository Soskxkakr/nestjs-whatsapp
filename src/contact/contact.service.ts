import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/common/database.service';
import { Gateway } from 'src/gateway/gateway.socket';
import { Contact } from 'whatsapp-web.js';

@Injectable()
export class ContactService {
  private logger = new Logger('Contact');
  constructor(
    private readonly gateway: Gateway,
    private readonly databaseService: DatabaseService,
  ) {}

  async findAll(sessionId: string): Promise<Contact[]> {
    return this.gateway.clients.get(sessionId).getContacts();
  }

  async syncContacts(
    sessionId: string,
  ): Promise<{ success: boolean; rowsAffected?: number; error?: string }> {
    this.logger.verbose(`${sessionId} is syncing their contacts.`);
    const contacts = await this.gateway.clients
      .get(sessionId)
      .getContacts()
      .catch((err) => {
        this.logger.error(`${sessionId} ERROR in fetching contacts: ${err}`);
        return [];
      });

    if (contacts.length === 0) return;

    const filteredContacts = contacts
      .filter(
        (contact: Contact) => contact.id.server !== 'lid' && !contact.isGroup,
      )
      .map(async (contact: Contact, idx: number) => {
        const profilePic = await contact.getProfilePicUrl().catch((err) => {
          this.logger.error(
            `${sessionId} ERROR in fetching profile picture: ${err}`,
          );
          return '-';
        });
        return {
          // ContactID: contact.id._serialized,
          Mobile: contact.number || '-',
          SubscriberID: idx,
          ThumbnailImagePath: profilePic || '-',
          ContactName:
            contact.name ||
            contact.pushname ||
            contact.shortName ||
            contact.verifiedName ||
            contact.number,
          isActive: 1,
          CreatedDate: new Date().toISOString(),
          ModifiedDate: new Date().toISOString(),
        };
      });

    const values = (await Promise.all(filteredContacts))
      .map((value) => {
        return `('${value.Mobile.replace(/'/g, "''")}', ${value.SubscriberID}, '${value.ThumbnailImagePath.replace(/'/g, "''")}', '${value.ContactName.replace(/'/g, "''")}', ${value.isActive}, '${value.CreatedDate}', '${value.ModifiedDate}')`;
      })
      .join(', ');

    const response = await this.databaseService
      .executeQuery(
        `INSERT INTO ${'em255'}.WhatsappContacts (Mobile, SubscriberID, ThumbnailImagePath, ContactName, isActive, CreatedDate, ModifiedDate) VALUES ${values}`,
      )
      .then((res) => {
        this.logger.log(
          `${sessionId} syncing successfull. Rows affected: ${res.rowsAffected[0]}.`,
        );
        return { success: true, rowsAffected: res.rowsAffected[0] };
      })
      .catch((err) => {
        this.logger.error(`${sessionId} failed to sync contacts: ${err}`);
        return { success: false, error: err };
      });

    return response;
  }
}
