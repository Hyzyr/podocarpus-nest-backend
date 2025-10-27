import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/_helpers/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/constants';
import { JwtStrategy } from '../_helpers/jwt.strategy';
import { MailerModule } from 'src/_helpers/mailer/mailer.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
    DatabaseModule,
    MailerModule,
    NotificationsModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
