import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { CampaignType } from './entities/campaign.entity';

class CreateCampaignDto {
  @IsString()
  name: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;
}

class DispatchCampaignDto {
  @IsArray()
  @IsUUID('4', { each: true })
  contactIds: string[];
}

@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() body: CreateCampaignDto) {
    return this.campaignsService.create(user.tenantId, body);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.campaignsService.findAll(user.tenantId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.campaignsService.getStats(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.campaignsService.findOne(id, user.tenantId);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: Partial<CreateCampaignDto>,
  ) {
    return this.campaignsService.update(id, user.tenantId, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.campaignsService.remove(id, user.tenantId);
  }

  @Post(':id/dispatch')
  dispatch(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: DispatchCampaignDto,
  ) {
    return this.campaignsService.dispatch(id, user.tenantId, body.contactIds);
  }
}
