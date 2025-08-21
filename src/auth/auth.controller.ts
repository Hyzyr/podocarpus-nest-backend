import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() body: { email: string; password: string; role: UserRole }) {
    console.log('register hitted', body);
    return this.auth.register(body.email, body.password, body.role);
  }

  @Post('forgot-password')
  forgotPass(@Body('email') email: string) {
    return this.auth.forgotPass(email);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    console.log('login hitted');
    return this.auth.login(body.email, body.password);
  }
}
