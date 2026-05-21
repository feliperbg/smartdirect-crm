import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { SacService } from './sac.service';
import { SacController } from './sac.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, TicketMessage])],
  providers: [SacService],
  controllers: [SacController],
  exports: [SacService],
})
export class SacModule {}
