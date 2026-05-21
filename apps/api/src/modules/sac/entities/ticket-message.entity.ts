import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../../users/user.entity';

export enum MessageType {
  COMMENT = 'comment',
  INTERNAL = 'internal',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.COMMENT,
  })
  type: MessageType;

  @ManyToOne(() => Ticket, (ticket) => ticket.messages)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column()
  ticketId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: false })
  isFromContact: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
