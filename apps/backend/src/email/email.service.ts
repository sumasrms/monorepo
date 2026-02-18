import { Injectable, Logger } from '@nestjs/common';
import { resend } from 'lib/email/resend';

export type EmailTemplateContext = {
  title?: string;
  message?: string;
  name?: string;
  [key: string]: unknown;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: EmailTemplateContext,
  ) {
    return this.sendEmailDirect(to, subject, template, context);
  }

  async sendEmailDirect(
    to: string,
    subject: string,
    template: string,
    context: EmailTemplateContext,
  ) {
    try {
      const html = this.renderTemplate(template, context);

      await resend.emails.send({
        from: process.env.BETTER_AUTH_EMAIL || 'delivered@resend.dev',
        to,
        subject,
        html,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email: ${message}`);
      throw error;
    }
  }

  private renderTemplate(
    template: string,
    context: EmailTemplateContext,
  ): string {
    const title = context?.title || 'Notification';
    const message = context?.message || '';
    const name = context?.name ? `Hi ${context.name},` : 'Hi,';

    if (template) {
      return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>${name}</p>
          <p>${message}</p>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>${name}</p>
        <p>${title}</p>
        <p>${message}</p>
      </div>
    `;
  }
}
