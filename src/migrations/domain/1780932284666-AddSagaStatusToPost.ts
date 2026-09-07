import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSagaStatusToPost1780932284666 implements MigrationInterface {
  name = 'AddSagaStatusToPost1780932284666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists: hasPostEnum }] = (await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'posts_saga_status_enum')`,
    )) as [{ exists: boolean }];

    if (!hasPostEnum) {
      await queryRunner.query(
        `CREATE TYPE "public"."posts_saga_status_enum" AS ENUM('PENDING', 'DONE', 'CANCEL')`,
      );
    }

    const hasPostColumn = await queryRunner.hasColumn('posts', 'saga_status');

    if (!hasPostColumn) {
      await queryRunner.query(
        `ALTER TABLE "posts" ADD "saga_status" "public"."posts_saga_status_enum" NOT NULL DEFAULT 'PENDING'`,
      );
      await queryRunner.query(`CREATE INDEX "IDX_posts_saga_status" ON "posts" ("saga_status")`);
      await queryRunner.query(`UPDATE "posts" SET "saga_status" = 'DONE'`);
    }

    const [{ exists: hasCommentEnum }] = (await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comments_saga_status_enum')`,
    )) as [{ exists: boolean }];

    if (!hasCommentEnum) {
      await queryRunner.query(
        `CREATE TYPE "public"."comments_saga_status_enum" AS ENUM('PENDING', 'DONE', 'CANCEL')`,
      );
    }

    const hasCommentColumn = await queryRunner.hasColumn('comments', 'saga_status');

    if (!hasCommentColumn) {
      await queryRunner.query(
        `ALTER TABLE "comments" ADD "saga_status" "public"."comments_saga_status_enum" NOT NULL DEFAULT 'PENDING'`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_comments_saga_status" ON "comments" ("saga_status")`,
      );
      await queryRunner.query(`UPDATE "comments" SET "saga_status" = 'DONE'`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_comments_saga_status"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "saga_status"`);
    await queryRunner.query(`DROP TYPE "public"."comments_saga_status_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_posts_saga_status"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "saga_status"`);
    await queryRunner.query(`DROP TYPE "public"."posts_saga_status_enum"`);
  }
}
