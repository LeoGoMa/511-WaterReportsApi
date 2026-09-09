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

  // Avisa a los usuarios con notificaciones activas; si no hay ninguno, al correo fijo de la cuadrilla.
  private async resolveRecipients(): Promise<string[]> {
    const emails = await this.usersService.findNotificationEmails();
    return emails.length > 0 ? emails : [envs.MAILER_CREW];
  }
}
