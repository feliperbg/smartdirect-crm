import { Controller, Post, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() body: CreateTenantDto) {
    return this.tenantsService.create(body);
  }
}
