import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pipeline } from './entities/pipeline.entity';
import { Stage } from './entities/stage.entity';
import { Deal } from './entities/deal.entity';
import { Contact } from './entities/contact.entity';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pipeline, Stage, Deal, Contact])],
  providers: [PipelineService, ContactsService],
  controllers: [PipelineController, ContactsController],
  exports: [PipelineService, ContactsService],
})
export class PipelineModule {}
