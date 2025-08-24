import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AuthResponseDto,
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto';

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
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.role);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: AuthResponseDto,
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
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
