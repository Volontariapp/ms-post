import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Index de pagination, additifs et idempotents (phase expand).
 * - comments ("postId", "createdAt" DESC): ListComments (WHERE postId ORDER BY createdAt DESC).
 * - posts ("createdAt" DESC): ListPosts du fil global (ORDER BY createdAt DESC avec filtre
 *   media_status / authorId appliques pendant le parcours de l'index).
 *
 * Pas de CREATE INDEX CONCURRENTLY: il impose `transaction = false`, or TypeORM 0.3.30 lance
 * ForbiddenTransactionModeOverrideError des qu'une migration surcharge le mode transactionnel
 * quand le mode par defaut est "all" (scripts migration:run:* sans option -t). Ces index
 * verrouillent donc les ecritures de leur table le temps de la construction.
 * L'EXPLAIN n'a pas ete execute: l'utilite des index est a valider sur une base de dev.
 */
export class AddCommentsAndPostsFeedIndexes1792200000000 implements MigrationInterface {
  name = 'AddCommentsAndPostsFeedIndexes1792200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_comments_post_created_at" ON "comments" ("postId", "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_created_at" ON "posts" ("createdAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_posts_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_comments_post_created_at"`);
  }
}
