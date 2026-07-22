import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { EmailVerificationService } from './services/email-verification.service';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CommonResponse } from 'src/common/types/common.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  AddExtraEmailDto,
  AuthResponseDto,
  ConfirmEmailDto,
  DisownSignupDto,
  ExtraEmailDto,
  GoogleLoginDto,
  LoginBodyDto,
  MessageResponseDto,
  OnboardStep1Dto,
  OnboardStep2Dto,
  RegisterBodyDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private emailVerification: EmailVerificationService,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
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
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
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

  @Post('google')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Login or register with a Google ID token' })
  @ApiResponse({
    status: 200,
    description: 'User logged in with Google successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async google(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.auth.googleLogin(dto.idToken, reply, dto.role);
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
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  async forgotPass(@Body() dto: RequestPasswordResetDto) {
    return this.auth.forgotPass(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
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

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Update profile information for the currently logged-in user, including profile photo URL'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: CurrentUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(user, dto);
  }

  // -------------------- EXTRA CONTACT EMAILS --------------------

  @UseGuards(JwtAuthGuard)
  @Get('emails')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List extra contact emails for the current user',
    description:
      'Returns the additional (non-login) contact emails attached to the account, with their verification status.',
  })
  @ApiResponse({ status: 200, type: [ExtraEmailDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listEmails(@CurrentUser() user: CurrentUser) {
    return this.emailVerification.listExtraEmails(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('emails')
  @Throttle({ default: { ttl: 300_000, limit: 3 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add an extra contact email and send a confirmation link',
    description:
      'Adds an unverified extra email and emails a magic link to confirm it. Max 2 extra emails per user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Confirmation email sent',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Maximum number of extra emails reached',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already added, or is your account email',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addEmail(
    @CurrentUser() user: CurrentUser,
    @Body() dto: AddExtraEmailDto,
  ) {
    return this.emailVerification.addExtraEmail(user, dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('emails/:id/resend')
  @Throttle({ default: { ttl: 300_000, limit: 3 } })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'UserEmail id to resend the link for' })
  @ApiOperation({ summary: 'Resend the confirmation link for an extra email' })
  @ApiResponse({
    status: 200,
    description: 'Confirmation email sent',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Email is already verified' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendEmail(
    @CurrentUser() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.emailVerification.resendExtraEmail(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('emails/:id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'UserEmail id to remove' })
  @ApiOperation({ summary: 'Remove an extra contact email' })
  @ApiResponse({
    status: 200,
    description: 'Email removed',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteEmail(
    @CurrentUser() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.emailVerification.deleteExtraEmail(user, id);
  }

  @Post('emails/confirm')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({
    summary: 'Confirm an extra email using a magic-link token',
    description:
      'Public endpoint reached from the confirmation link. The token in the body is the proof of ownership.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email confirmed',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.emailVerification.confirmExtraEmail(dto.token);
  }

  // -------------------- SIGNUP DISOWN --------------------

  @Post('disown')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({
    summary: 'Disown a signup ("this wasn\'t me") — blocks the account',
    description:
      'Public endpoint reached from the "this wasn\'t me" link in the welcome email. Blocks the account and notifies admins for review.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account blocked and admins notified',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async disown(@Body() dto: DisownSignupDto) {
    return this.emailVerification.disownSignup(dto.token);
  }
}
