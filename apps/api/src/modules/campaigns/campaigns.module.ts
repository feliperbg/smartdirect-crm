import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Campaign } from './entities/campaign.entity';
import { CampaignDispatch } from './entities/campaign-dispatch.entity';
import { Contact } from '../pipeline/entities/contact.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsProcessor } from './campaigns.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignDispatch, Contact]),
    BullModule.registerQueue({
      name: 'campaigns',
    }),
  ],
  providers: [CampaignsService, CampaignsProcessor],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
