import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { envs } from '../config/envs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    service: envs.MAILER_SERVICE,
    auth: {
      user: envs.MAILER_USER,
      pass: envs.MAILER_TOKEN,
    },
  });

  async sendEmail(
    to: string | string[],
    subject: string,
    template: string,
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: envs.MAILER_USER,
        to,
        subject,
        html: template,
      });
      return true;
    } catch (error) {
      this.logger.error('No se pudo enviar el correo', error);
      return false;
    }
  }
}
