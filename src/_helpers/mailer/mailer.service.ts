import { Injectable } from '@nestjs/common';
import { MAIL_HOST, MAIL_PASS, MAIL_USER, WEBSITE_NAME } from 'src/constants';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: 2525,
      // secure: false,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    await this.transporter.sendMail({
      from: `"${WEBSITE_NAME}" \n<${MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  }
}
