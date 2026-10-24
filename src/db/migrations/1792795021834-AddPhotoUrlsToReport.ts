import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoUrlsToReport1792795021834 implements MigrationInterface {
  name = 'AddPhotoUrlsToReport1792795021834';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "WATER_REPORT" ADD "photoUrl" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "WATER_REPORT" ADD "repairPhotoUrl" character varying(500)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "WATER_REPORT" DROP COLUMN "repairPhotoUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "WATER_REPORT" DROP COLUMN "photoUrl"`,
    );
  }
}
