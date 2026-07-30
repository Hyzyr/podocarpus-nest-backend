import { Injectable, Logger } from '@nestjs/common';
import {
  MAIL_HOST,
  MAIL_PASS,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
} from 'src/common/constants';
import * as nodemailer from 'nodemailer';
import { MAIL_SENDERS, MailSenderKey } from './mailer.constants';
import { EmailTemplateOptions, renderEmail } from './templates/base.template';

/** Either a named sender from MAIL_SENDERS, or an explicit address. */
export type MailSender = MailSenderKey | { address: string; name?: string };

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  /** Which identity to send as. Defaults to 'support'. */
  from?: MailSender;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface SendTemplateOptions
  extends Omit<SendMailOptions, 'text' | 'html'>,
    EmailTemplateOptions {}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  private readonly transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });

  /** True when SMTP credentials are present. */
  get isConfigured(): boolean {
    return Boolean(MAIL_HOST && MAIL_USER && MAIL_PASS);
  }

  /** Verify SMTP connectivity — useful for a health check or startup probe. */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error(
        `SMTP verification failed: ${(error as Error).message}`,
      );
      return false;
    }
  }

  private resolveFrom(from: MailSender = 'support'): string {
    const sender =
      typeof from === 'string'
        ? MAIL_SENDERS[from]
        : { address: from.address, name: from.name };

    return sender.name
      ? `"${sender.name}" <${sender.address}>`
      : sender.address;
  }

  /**
   * Send a raw email. Prefer sendTemplate() for anything customer-facing so it
   * picks up the branded layout.
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.isConfigured) {
      throw new Error(
        'Mailer is not configured. Set MAIL_HOST, MAIL_PORT, MAIL_USER, and MAIL_PASS.',
      );
    }

    const { to, subject, text, html, from, cc, bcc, replyTo } = options;

    await this.transporter.sendMail({
      from: this.resolveFrom(from),
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: Array.isArray(cc) ? cc.join(', ') : cc,
      bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc,
      replyTo,
      subject,
      text,
      html,
    });

    this.logger.log(
      `Sent "${subject}" to ${Array.isArray(to) ? `${to.length} recipients` : to}`,
    );
  }

  /**
   * Send a branded email. Content is described declaratively (heading,
   * paragraphs, button…) and rendered through the shared template, which also
   * produces the plaintext part — so callers never write the copy twice.
   */
  async sendTemplate(options: SendTemplateOptions): Promise<void> {
    const { to, subject, from, cc, bcc, replyTo, ...template } = options;
    const { html, text } = renderEmail(template);

    await this.sendMail({ to, subject, from, cc, bcc, replyTo, html, text });
  }

  /**
   * Fire-and-forget variant for non-critical mail (welcome notes, receipts).
   * Logs and swallows failures so a mail outage never breaks the request.
   */
  async sendTemplateSafe(options: SendTemplateOptions): Promise<boolean> {
    try {
      await this.sendTemplate(options);
      return true;
    } catch (error) {
      this.logger.warn(
        `Failed to send "${options.subject}": ${(error as Error).message}`,
      );
      return false;
    }
  }
}
