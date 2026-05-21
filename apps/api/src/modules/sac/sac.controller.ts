import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SacService } from './sac.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TicketStatus, TicketPriority } from './entities/ticket.entity';
import { MessageType } from './entities/ticket-message.entity';

class CreateTicketDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

class AddMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  isFromContact?: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('sac')
export class SacController {
  constructor(private readonly sacService: SacService) {}

  @Post('tickets')
  createTicket(@CurrentUser() user: any, @Body() body: CreateTicketDto) {
    return this.sacService.createTicket(user.tenantId, body);
  }

  @Get('tickets')
  findAllTickets(
    @CurrentUser() user: any,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.sacService.findAllTickets(user.tenantId, {
      status,
      priority,
      assignedToId,
    });
  }

  @Get('tickets/stats')
  getStats(@CurrentUser() user: any) {
    return this.sacService.getStats(user.tenantId);
  }

  @Get('tickets/:id')
  findOneTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.sacService.findOneTicket(id, user.tenantId);
  }

  @Put('tickets/:id')
  updateTicket(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: UpdateTicketDto,
  ) {
    return this.sacService.updateTicket(id, user.tenantId, body);
  }

  @Post('tickets/:id/messages')
  addMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: AddMessageDto,
  ) {
    return this.sacService.addMessage(id, user.tenantId, {
      ...body,
      userId: user.id,
    });
  }
}
