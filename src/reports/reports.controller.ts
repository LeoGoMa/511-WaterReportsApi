import { Body, Controller, Get, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dtos/create-report.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { generateReportTemplate } from './templates/report.template';
import { envs } from '../config/envs';

@Controller('reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() createReportDto: CreateReportDto) {
    const report = await this.reportsService.create(createReportDto);

    const template = generateReportTemplate(createReportDto);
    const notified = await this.emailService.sendEmail(
      await this.resolveRecipients(),
      `Nueva fuga reportada (severidad ${createReportDto.severity})`,
      template,
    );

    return { report, notified };
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  // La cuadrilla siempre recibe el aviso; se suman los usuarios con notificaciones activas.
  private async resolveRecipients(): Promise<string[]> {
    const emails = await this.usersService.findNotificationEmails();
    return [...new Set([envs.MAILER_CREW, ...emails])];
  }
}
