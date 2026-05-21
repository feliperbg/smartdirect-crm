import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreatePipelineDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class CreateStageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  order?: number;

  @IsOptional()
  @IsString()
  color?: string;
}

class CreateDealDto {
  @IsString()
  title: string;

  @IsUUID()
  stageId: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  value?: number;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  customFields?: Record<string, any>;
}

@UseGuards(JwtAuthGuard)
@Controller('pipelines')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post()
  createPipeline(@CurrentUser() user: any, @Body() body: CreatePipelineDto) {
    return this.pipelineService.createPipeline(user.tenantId, body);
  }

  @Get()
  findAllPipelines(@CurrentUser() user: any) {
    return this.pipelineService.findAllPipelines(user.tenantId);
  }

  @Get(':id')
  findOnePipeline(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pipelineService.findOnePipeline(id, user.tenantId);
  }

  @Post(':id/stages')
  createStage(
    @CurrentUser() user: any,
    @Param('id') pipelineId: string,
    @Body() body: CreateStageDto,
  ) {
    return this.pipelineService.createStage(user.tenantId, pipelineId, body);
  }

  @Put('stages/:id')
  updateStage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: Partial<CreateStageDto>,
  ) {
    return this.pipelineService.updateStage(id, user.tenantId, body);
  }

  @Delete('stages/:id')
  removeStage(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pipelineService.removeStage(id, user.tenantId);
  }

  @Post('deals')
  createDeal(@CurrentUser() user: any, @Body() body: CreateDealDto) {
    return this.pipelineService.createDeal(user.tenantId, body);
  }

  @Get('deals/all')
  findAllDeals(
    @CurrentUser() user: any,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.pipelineService.findAllDeals(user.tenantId, pipelineId);
  }

  @Get('deals/:id')
  findOneDeal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pipelineService.findOneDeal(id, user.tenantId);
  }

  @Put('deals/:id')
  updateDeal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: Partial<CreateDealDto>,
  ) {
    return this.pipelineService.updateDeal(id, user.tenantId, body);
  }

  @Delete('deals/:id')
  removeDeal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pipelineService.removeDeal(id, user.tenantId);
  }
}
