import { GetPostResponse } from '@volontariapp/contracts-nest';
import { PostDTO } from '../common/post/post.dto.js';

export class GetPostResponseDTO implements GetPostResponse {
  post!: PostDTO;
}
