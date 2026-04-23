import { MigrationInterface, QueryRunner } from "typeorm";

export class JobsOutboxAndEventQueueWithTraceId1776975278062 implements MigrationInterface {
    name = 'JobsOutboxAndEventQueueWithTraceId1776975278062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "event_queue" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying(20) NOT NULL DEFAULT 'PENDING', "attempts" integer NOT NULL DEFAULT '0', "lastError" text, "type" character varying(100) NOT NULL, "emitter" character varying(100) NOT NULL, "updated_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "traceId" uuid, "version" integer NOT NULL, "payload" jsonb NOT NULL, "processed_at" TIMESTAMP, CONSTRAINT "PK_f2ab43ee6a569a89ba286db2fa6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "jobs_outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying(20) NOT NULL DEFAULT 'PENDING', "attempts" integer NOT NULL DEFAULT '0', "lastError" text, "type" character varying(100) NOT NULL, "emitter" character varying(100) NOT NULL, "updated_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "traceId" uuid, "target" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "scheduled_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_7172b6dd5767f423ecb44d9fb57" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "jobs_outbox"`);
        await queryRunner.query(`DROP TABLE "event_queue"`);
    }

}
