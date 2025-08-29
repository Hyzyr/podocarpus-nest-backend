import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AuthResponseDto,
  LoginBodyDto,
  RegisterBodyDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  register(
    @Body() dto: RegisterBodyDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.auth.register(dto.email, dto.password, dto.role, reply);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  login(
    @Body() dto: LoginBodyDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.auth.login(dto.email, dto.password, reply);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user from HttpOnly cookie' })
  @ApiCookieAuth('token') // Swagger will show cookie auth field
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@Req() req: FastifyRequest) {
    return this.auth.getCurrentUser(req);
  }

  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  // @ApiCookieAuth(REFRESH_TOKEN_KEY)
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.auth.refreshTokens(req, reply);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  forgotPass(@Body() dto: RequestPasswordResetDto) {
    return this.auth.forgotPass(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
