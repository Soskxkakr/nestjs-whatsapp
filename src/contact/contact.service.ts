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
      .map(async (contact: Contact) => {
        const profilePic = await this.fetchWithTimeout(
          this.gateway.clients
            .get(sessionId)
            .getProfilePicUrl(contact.id._serialized),
          3000,
          '',
        ).catch((err) => {
          this.logger.error(
            `${sessionId} ERROR in fetching profile picture: ${err}`,
          );
          return '';
        });
        return {
          Mobile: contact.number || '',
          SubscriberID: '',
          ThumbnailImagePath: profilePic || '',
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

    const contactsData = await Promise.all(filteredContacts);
    const chunkSize = 800;
    let totalRowsAffected = 0;

    for (let i = 0; i < contactsData.length; i += chunkSize) {
      const chunk = contactsData.slice(i, i + chunkSize);
      const values = chunk
        .map((value) => {
          return `('+${value.Mobile.replace(/'/g, "''")}', '${value.SubscriberID}', '${value.ThumbnailImagePath.replace(/'/g, "''")}', N'${value.ContactName.replace(/'/g, "''")}', ${value.isActive}, '${value.CreatedDate}', '${value.ModifiedDate}')`;
        })
        .join(', ');

      await this.databaseService
        .executeQuery(`DROP TABLE IF EXISTS ${sessionId}.TempWhatsAppContacts`)
        .then(() => {
          this.logger.verbose(
            `TABLE ${sessionId}.TempWhatsAppContacts DROPPED.`,
          );
        })
        .catch((err) => {
          this.logger.error(
            `ERROR in dropping TABLE ${sessionId}.TempWhatsAppContacts: ${err}`,
          );
        });

      await this.databaseService
        .executeQuery(
          `SELECT * INTO ${sessionId}.TempWhatsAppContacts FROM ${sessionId}.WhatsAppContacts; TRUNCATE TABLE ${sessionId}.TempWhatsAppContacts`,
        )
        .then(() => {
          this.logger.verbose(
            `TABLE ${sessionId}.TempWhatsAppContacts CREATED`,
          );
        })
        .catch((err) => {
          this.logger.error(
            `ERROR in copying TABLE to ${sessionId}.TempWhatsAppContacts: ${err}`,
          );
        });

      await this.databaseService
        .executeQuery(
          `INSERT INTO ${sessionId}.TempWhatsAppContacts (Mobile, SubscriberID, ThumbnailImagePath, ContactName, isActive, CreatedDate, ModifiedDate) VALUES ${values}`,
        )
        .then((res) => {
          this.logger.verbose(
            `Contacts inserted into ${sessionId}.TempWhatsAppContacts. Rows affected: ${res.rowsAffected[0]}`,
          );
        })
        .catch((err) => {
          this.logger.error(
            `ERROR in inserting contacts into TABLE ${sessionId}.TempWhatsAppContacts: ${err}`,
          );
        });

      await this.databaseService
        .executeQuery(
          `UPDATE ${sessionId}.WhatsAppContacts 
          SET 
            ThumbnailImagePath = t.ThumbnailImagePath,
            ContactName = t.ContactName,
            isActive = t.isActive,
            ModifiedDate = t.ModifiedDate
          FROM ${sessionId}.TempWhatsAppContacts t
          WHERE ${sessionId}.WhatsAppContacts.Mobile = t.Mobile`,
        )
        .then((res) => {
          this.logger.verbose(
            `TABLE ${sessionId}.WhatsAppContacts updated with the latest data. Rows affected: ${res.rowsAffected[0]}`,
          );
        })
        .catch((err) => {
          this.logger.error(
            `ERROR in updating the ${sessionId}.WhatsAppContacts: ${err}`,
          );
        });

      const response = await this.databaseService
        .executeQuery(
          `INSERT INTO ${sessionId}.WhatsappContacts (Mobile, SubscriberID, ThumbnailImagePath, ContactName, isActive, CreatedDate, ModifiedDate) 
          SELECT Mobile, SubscriberID, ThumbnailImagePath, ContactName, isActive, CreatedDate, ModifiedDate
          FROM ${sessionId}.TempWhatsAppContacts t
          WHERE NOT EXISTS (
            SELECT 1 FROM ${sessionId}.WhatsAppContacts w WHERE w.mobile = t.mobile
          )`,
        )
        .then((res) => {
          this.logger.log(
            `New data inserted to ${sessionId}.WhatsAppContacts. Rows affected: ${res.rowsAffected[0]}.`,
          );
          totalRowsAffected += res.rowsAffected[0];
          return { success: true, rowsAffected: res.rowsAffected[0] };
        })
        .catch((err) => {
          this.logger.error(
            `${sessionId} failed to insert data to ${sessionId}.WhatsAppContacts: ${err}`,
          );
          return { success: false, error: err };
        });

      await this.databaseService
        .executeQuery(`DROP TABLE IF EXISTS ${sessionId}.TempWhatsAppContacts`)
        .then(() => {
          this.logger.verbose(
            `DROPPED TABLE ${sessionId}.TempWhatsAppContacts`,
          );
        })
        .catch((err) => {
          this.logger.error(
            `ERROR in dropping TABLE ${sessionId}.TempWhatsAppContacts: ${err}`,
          );
        });

      if (!response.success) {
        return response;
      }
    }

    return { success: true, rowsAffected: totalRowsAffected };
  }

  async fetchWithTimeout(
    promise: Promise<any>,
    timeout: number,
    defaultValue: any,
  ) {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise((resolve) => {
      timeoutHandle = setTimeout(() => resolve(defaultValue), timeout);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
