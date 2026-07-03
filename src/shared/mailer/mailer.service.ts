import { Injectable } from '@nestjs/common';
import {
  MAIL_FROM,
  MAIL_FROM_NAME,
  MAIL_HOST,
  MAIL_PASS,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
} from 'src/common/constants';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });

  constructor() {}

  async sendMail(to: string, subject: string, text: string, html?: string) {
    if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS) {
      throw new Error('Mailer is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, and MAIL_PASS.');
    }

    await this.transporter.sendMail({
      from: `"${MAIL_FROM_NAME}" <${MAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });
  }
}
