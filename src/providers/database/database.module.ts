import { Module } from '@nestjs/common';
import { PostgresModule } from './postgres/postgres.module';
import { Neo4jModule } from './neo4j/neo4j.module';

@Module({
  imports: [PostgresModule, Neo4jModule],
  exports: [PostgresModule, Neo4jModule],
})
export class DatabaseModule {}
