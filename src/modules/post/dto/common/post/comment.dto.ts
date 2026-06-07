import type { Comment, Timestamp } from '@volontariapp/contracts-nest';

export class CommentDTO implements Comment {
  id!: string;
  postId!: string;
  authorId!: string;
  content!: string;
  createdAt!: Timestamp | undefined;
  updatedAt!: Timestamp | undefined;
}
