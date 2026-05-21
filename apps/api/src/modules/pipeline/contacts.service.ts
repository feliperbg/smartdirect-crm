import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
  ) {}

  async create(tenantId: string, data: Partial<Contact>): Promise<Contact> {
    const contact = this.contactsRepository.create({ ...data, tenantId });
    return this.contactsRepository.save(contact);
  }

  async findAll(tenantId: string): Promise<Contact[]> {
    return this.contactsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({
      where: { id, tenantId },
    });
    if (!contact) throw new NotFoundException('Contato não encontrado');
    return contact;
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Contact>,
  ): Promise<Contact> {
    await this.findOne(id, tenantId);
    await this.contactsRepository.update({ id, tenantId }, data);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.contactsRepository.delete({ id, tenantId });
  }
}
