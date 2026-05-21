import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from './entities/ticket.entity';
import { TicketMessage, MessageType } from './entities/ticket-message.entity';

@Injectable()
export class SacService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
  ) {}

  async createTicket(
    tenantId: string,
    data: {
      title: string;
      description: string;
      priority?: TicketPriority;
      category?: string;
      contactId?: string;
      assignedToId?: string;
    },
  ): Promise<Ticket> {
    const ticket = this.ticketRepository.create({ ...data, tenantId });
    return this.ticketRepository.save(ticket);
  }

  async findAllTickets(
    tenantId: string,
    filters?: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assignedToId?: string;
    },
  ): Promise<Ticket[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.contact', 'contact')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
      .where('ticket.tenantId = :tenantId', { tenantId });

    if (filters?.status) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }
    if (filters?.priority) {
      query.andWhere('ticket.priority = :priority', {
        priority: filters.priority,
      });
    }
    if (filters?.assignedToId) {
      query.andWhere('ticket.assignedToId = :assignedToId', {
        assignedToId: filters.assignedToId,
      });
    }

    return query.orderBy('ticket.createdAt', 'DESC').getMany();
  }

  async findOneTicket(id: string, tenantId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, tenantId },
      relations: ['contact', 'assignedTo', 'messages', 'messages.user'],
    });
    if (!ticket) throw new NotFoundException('Ticket não encontrado');
    return ticket;
  }

  async updateTicket(
    id: string,
    tenantId: string,
    data: Partial<Ticket>,
  ): Promise<Ticket> {
    await this.findOneTicket(id, tenantId);
    if (data.status === TicketStatus.RESOLVED) {
      data.resolvedAt = new Date();
    }
    await this.ticketRepository.update({ id, tenantId }, data);
    return this.findOneTicket(id, tenantId);
  }

  async addMessage(
    ticketId: string,
    tenantId: string,
    data: {
      content: string;
      type?: MessageType;
      userId?: string;
      isFromContact?: boolean;
    },
  ): Promise<TicketMessage> {
    await this.findOneTicket(ticketId, tenantId);
    const message = this.messageRepository.create({ ...data, ticketId });
    return this.messageRepository.save(message);
  }

  async getStats(tenantId: string) {
    const total = await this.ticketRepository.count({ where: { tenantId } });
    const open = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.OPEN },
    });
    const inProgress = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.IN_PROGRESS },
    });
    const resolved = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.RESOLVED },
    });
    const closed = await this.ticketRepository.count({
      where: { tenantId, status: TicketStatus.CLOSED },
    });

    return { total, open, inProgress, resolved, closed };
  }
}
