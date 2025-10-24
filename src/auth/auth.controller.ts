import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../_helpers/jwt-auth.guard';
import { CommonResponse } from 'src/types/common.dto';
import { CurrentUser } from 'src/_helpers/user.decorator';
import {
  AuthResponseDto,
  LoginBodyDto,
  OnboardStep1Dto,
  OnboardStep2Dto,
  RegisterBodyDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';

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
  async register(
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
  async login(
    @Body() dto: LoginBodyDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.auth.login(dto.email, dto.password, reply);
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 204, description: 'User logged out successfully' })
  async logout(@Res({ passthrough: true }) reply: FastifyReply) {
    this.auth.logout(reply); // clears cookies
    return; // Nest handles 204
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
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.auth.refreshTokens(req, reply);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  async forgotPass(@Body() dto: RequestPasswordResetDto) {
    return this.auth.forgotPass(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  async reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboard/step1')
  @ApiOperation({ summary: 'Onboarding Step 1 - Personal Info' })
  @ApiResponse({
    status: 200,
    description: 'Step 1 saved successfully',
    type: CommonResponse,
  })
  async onboardStep1(
    @CurrentUser() user: CurrentUser,
    @Body() dto: OnboardStep1Dto,
  ) {
    return this.auth.onboardStep1(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('onboard/step2')
  @ApiOperation({ summary: 'Onboarding Step 2 - Investment Preferences' })
  @ApiResponse({
    status: 200,
    description: 'Step 2 saved successfully',
    type: CommonResponse,
  })
  async onboardStep2(
    @CurrentUser() user: CurrentUser,
    @Body() dto: OnboardStep2Dto,
  ) {
    return this.auth.onboardStep2(user, dto);
  }
}
