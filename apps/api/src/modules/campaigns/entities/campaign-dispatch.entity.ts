import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Contact } from '../../pipeline/entities/contact.entity';

export enum DispatchStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  OPENED = 'opened',
}

@Entity('campaign_dispatches')
export class CampaignDispatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.dispatches)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  campaignId: string;

  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'contactId' })
  contact: Contact;

  @Column({ nullable: true })
  contactId: string;

  @Column({ nullable: true })
  recipientEmail: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column({
    type: 'enum',
    enum: DispatchStatus,
    default: DispatchStatus.PENDING,
  })
  status: DispatchStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
