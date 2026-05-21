import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  Campaign,
  CampaignStatus,
  CampaignType,
} from './entities/campaign.entity';
import {
  CampaignDispatch,
  DispatchStatus,
} from './entities/campaign-dispatch.entity';
import { Contact } from '../pipeline/entities/contact.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignDispatch)
    private dispatchRepository: Repository<CampaignDispatch>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @Optional()
    @InjectQueue('campaigns')
    private campaignsQueue?: Queue,
  ) {}

  async create(tenantId: string, data: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaignRepository.create({ ...data, tenantId });
    return this.campaignRepository.save(campaign);
  }

  async findAll(tenantId: string): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id, tenantId },
      relations: ['dispatches', 'dispatches.contact'],
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return campaign;
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Campaign>,
  ): Promise<Campaign> {
    await this.findOne(id, tenantId);
    await this.campaignRepository.update({ id, tenantId }, data);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.campaignRepository.delete({ id, tenantId });
  }

  async dispatch(
    id: string,
    tenantId: string,
    contactIds: string[],
  ): Promise<Campaign> {
    const campaign = await this.findOne(id, tenantId);

    if (
      campaign.status === CampaignStatus.RUNNING ||
      campaign.status === CampaignStatus.DONE
    ) {
      throw new BadRequestException('Campanha já foi disparada');
    }

    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId })
      .andWhere('contact.id IN (:...ids)', { ids: contactIds })
      .getMany();

    if (contacts.length === 0) {
      throw new BadRequestException('Nenhum contato válido encontrado');
    }

    // Cria os dispatches
    const dispatches = contacts.map((contact) =>
      this.dispatchRepository.create({
        campaignId: campaign.id,
        contactId: contact.id,
        recipientEmail: contact.email,
        recipientPhone: contact.phone,
        status: DispatchStatus.PENDING,
      }),
    );
    await this.dispatchRepository.save(dispatches);

    // Atualiza campanha
    await this.campaignRepository.update(campaign.id, {
      status: CampaignStatus.RUNNING,
      totalRecipients: contacts.length,
      sentAt: new Date(),
    });

    if (this.campaignsQueue) {
      for (const dispatch of dispatches) {
        await this.campaignsQueue.add('send', {
          dispatchId: dispatch.id,
          campaignType: campaign.type,
        });
      }
    } else {
      for (const dispatch of dispatches) {
        await this.updateDispatchStatus(dispatch.id, DispatchStatus.SENT);
      }
    }

    return this.findOne(id, tenantId);
  }

  async getStats(tenantId: string) {
    const total = await this.campaignRepository.count({ where: { tenantId } });
    const draft = await this.campaignRepository.count({
      where: { tenantId, status: CampaignStatus.DRAFT },
    });
    const running = await this.campaignRepository.count({
      where: { tenantId, status: CampaignStatus.RUNNING },
    });
    const done = await this.campaignRepository.count({
      where: { tenantId, status: CampaignStatus.DONE },
    });

    return { total, draft, running, done };
  }

  async updateDispatchStatus(
    dispatchId: string,
    status: DispatchStatus,
    errorMessage?: string,
  ) {
    await this.dispatchRepository.update(dispatchId, {
      status,
      errorMessage,
      sentAt: status === DispatchStatus.SENT ? new Date() : undefined,
    });

    // Atualiza contadores da campanha
    const dispatch = await this.dispatchRepository.findOne({
      where: { id: dispatchId },
      relations: ['campaign'],
    });

    if (dispatch) {
      const sent = await this.dispatchRepository.count({
        where: { campaignId: dispatch.campaignId, status: DispatchStatus.SENT },
      });
      const failed = await this.dispatchRepository.count({
        where: {
          campaignId: dispatch.campaignId,
          status: DispatchStatus.FAILED,
        },
      });
      const pending = await this.dispatchRepository.count({
        where: {
          campaignId: dispatch.campaignId,
          status: DispatchStatus.PENDING,
        },
      });

      const updateData: Partial<Campaign> = {
        totalSent: sent,
        totalFailed: failed,
      };

      if (pending === 0) {
        updateData.status = CampaignStatus.DONE;
      }

      await this.campaignRepository.update(dispatch.campaignId, updateData);
    }
  }
}
