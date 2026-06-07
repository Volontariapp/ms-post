import type {
  GetPostResponse,
  CreatePostResponse,
  AdminCreatePostResponse,
  UpdatePostResponse,
  ListPostsResponse,
  DeletePostResponse,
  DeleteMyPostsResponse,
  PaginationResponse,
} from '@volontariapp/contracts-nest';
import type { PostDTO } from '../common/post/post.dto.js';

export class GetPostResponseDTO implements GetPostResponse {
  post!: PostDTO;
}

export class CreatePostResponseDTO implements CreatePostResponse {
  post: PostDTO | undefined;
}

export class AdminCreatePostResponseDTO implements AdminCreatePostResponse {
  post: PostDTO | undefined;
}

export class UpdatePostResponseDTO implements UpdatePostResponse {
  post: PostDTO | undefined;
}

export class ListPostsResponseDTO implements ListPostsResponse {
  posts!: PostDTO[];
  pagination: PaginationResponse | undefined;
}

export class DeletePostResponseDTO implements DeletePostResponse {
  success!: boolean;
}

export class DeleteMyPostsResponseDTO implements DeleteMyPostsResponse {
  success!: boolean;
}
