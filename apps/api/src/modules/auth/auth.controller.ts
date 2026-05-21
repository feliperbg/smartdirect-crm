import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as express from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

const getAuthCookieOptions = (
  maxAge?: number,
): express.CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    ...(maxAge ? { maxAge } : {}),
  };
};

class RegisterDto {
  @IsString()
  @MinLength(2)
  tenantName: string;

  @IsEmail()
  tenantEmail: string;

  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @IsString()
  @MinLength(2)
  userName: string;

  @IsEmail()
  userEmail: string;

  @IsString()
  @MinLength(6)
  userPassword: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.register(body);

    response.cookie(
      'crm_token',
      result.token,
      getAuthCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    return {
      user: result.user,
      tenant: result.tenant,
    };
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const result = await this.authService.login(body);

    response.cookie(
      'crm_token',
      result.token,
      getAuthCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    return {
      user: result.user,
      tenant: result.tenant,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: express.Response) {
    response.clearCookie('crm_token', getAuthCookieOptions());
    return { success: true };
  }
}
