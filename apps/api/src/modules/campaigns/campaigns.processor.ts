import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { CampaignsService } from './campaigns.service';
import { DispatchStatus } from './entities/campaign-dispatch.entity';
import { CampaignType } from './entities/campaign.entity';

@Processor('campaigns')
export class CampaignsProcessor {
  private readonly logger = new Logger(CampaignsProcessor.name);

  constructor(private campaignsService: CampaignsService) {}

  @Process('send')
  async handleSend(
    job: Job<{ dispatchId: string; campaignType: CampaignType }>,
  ) {
    const { dispatchId, campaignType } = job.data;

    this.logger.log(`Processando envio ${dispatchId} (${campaignType})`);

    try {
      // Aqui faremos a integração real com cada provedor depois
      // Por enquanto, simulamos o envio com sucesso
      switch (campaignType) {
        case CampaignType.EMAIL:
          await this.sendEmail(dispatchId);
          break;
        case CampaignType.SMS:
          await this.sendSms(dispatchId);
          break;
        case CampaignType.WHATSAPP:
          await this.sendWhatsapp(dispatchId);
          break;
      }

      await this.campaignsService.updateDispatchStatus(
        dispatchId,
        DispatchStatus.SENT,
      );
      this.logger.log(`Envio ${dispatchId} concluído`);
    } catch (error) {
      this.logger.error(`Erro no envio ${dispatchId}: ${error.message}`);
      await this.campaignsService.updateDispatchStatus(
        dispatchId,
        DispatchStatus.FAILED,
        error.message,
      );
    }
  }

  private async sendEmail(dispatchId: string): Promise<void> {
    // TODO: integrar com Mailchimp/Nodemailer
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private async sendSms(dispatchId: string): Promise<void> {
    // TODO: integrar com provedor SMS
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  private async sendWhatsapp(dispatchId: string): Promise<void> {
    // TODO: integrar com Meta Cloud API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
