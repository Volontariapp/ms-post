import type {
  CreateCommentResponse,
  ListCommentsResponse,
  DeleteCommentResponse,
  PaginationResponse,
} from '@volontariapp/contracts-nest';
import type { CommentDTO } from '../common/post/comment.dto.js';

export class CreateCommentResponseDTO implements CreateCommentResponse {
  comment!: CommentDTO | undefined;
}

export class ListCommentsResponseDTO implements ListCommentsResponse {
  comments!: CommentDTO[];
  pagination!: PaginationResponse | undefined;
}

export class DeleteCommentResponseDTO implements DeleteCommentResponse {
  success!: boolean;
}
