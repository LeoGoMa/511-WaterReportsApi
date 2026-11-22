import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { envs } from '../config/envs';

@Injectable()
export class StorageService {
  // Sin credenciales explicitas: en local el SDK lee AWS_ACCESS_KEY_ID del .env y en la EC2 usa su rol IAM.
  private client = new S3Client({ region: envs.AWS_REGION });

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const prefix = folder.replace(/^\/+|\/+$/g, '');
    const key = `${prefix}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: envs.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${envs.AWS_BUCKET_NAME}.s3.${envs.AWS_REGION}.amazonaws.com/${key}`;
  }
}
