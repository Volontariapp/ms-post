import { PostQuery, ListPostsQuery } from '@volontariapp/contracts-nest';
import { IsUUID } from 'class-validator';

export class PostQueryDTO implements PostQuery {
  @IsUUID()
  id!: string;
}

export class ListPostsQueryDTO implements ListPostsQuery {
  @IsUUID()
  eventId!: string;
}
