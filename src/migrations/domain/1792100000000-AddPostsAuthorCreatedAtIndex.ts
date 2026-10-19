import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Serves ListRecentPostsByAuthors: recent posts of a set of authors, newest first.
 * Additive and idempotent (expand phase), safe to run while the service is up.
 */
export class AddPostsAuthorCreatedAtIndex1792100000000 implements MigrationInterface {
  name = 'AddPostsAuthorCreatedAtIndex1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_posts_author_created_at" ON "posts" ("authorId", "createdAt" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_posts_author_created_at"`);
  }
}
