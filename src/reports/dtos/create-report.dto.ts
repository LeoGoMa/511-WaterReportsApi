import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsEnum(Severity, { message: 'severity debe ser low, medium o high' })
  severity!: Severity;

  @IsString()
  @Length(10, 20)
  reporterPhone!: string;
}
