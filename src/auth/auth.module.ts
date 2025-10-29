import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthNotificationsService } from './services/auth.notifications.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/shared/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/common/constants';
import { JwtStrategy } from 'src/common/strategies/jwt.strategy';
import { MailerModule } from 'src/shared/mailer/mailer.module';
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
  providers: [AuthService, AuthNotificationsService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
