import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dtos/create-report.dto';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { StorageService } from '../storage/storage.service';
import { generateReportTemplate } from './templates/report.template';
import { envs } from '../config/envs';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

@Controller('reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private emailService: EmailService,
    private usersService: UsersService,
    private storageService: StorageService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: MAX_PHOTO_SIZE } }),
  )
  async create(
    @Body() createReportDto: CreateReportDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!photo) {
      throw new BadRequestException(
        'La foto de la fuga (photo) es obligatoria',
      );
    }
    if (!photo.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo photo debe ser una imagen');
    }

    const photoUrl = await this.storageService.uploadFile(photo, 'reports');
    const report = await this.reportsService.create(createReportDto, photoUrl);

    const template = generateReportTemplate(createReportDto, photoUrl);
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
