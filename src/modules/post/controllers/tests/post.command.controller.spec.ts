import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PostCommandController } from '../post.command.controller.js';
import {
  PostService,
  CommentService,
  PostEntity,
  PostMediaEntity,
  PostMediaStatus,
  PostMediaScanStatus,
} from '@volontariapp/domain-post';
import { PostTransformer } from '../../transformers/index.js';
import { StorageClientService } from '@volontariapp/storage-client';
import {
  FileStatus,
  ScanStatus,
  ValidationMode,
  PostMediaStatus as ContractsPostMediaStatus,
  type FileMetadata,
  type ConfirmFileAttachmentResponse,
} from '@volontariapp/contracts-nest';
import { NotFoundError, InternalServerError } from '@volontariapp/errors';
import { SagaStatus } from '@volontariapp/shared';
import type { AuthUser } from '@volontariapp/auth';
import type { CreatePostCommandDTO } from '../../dto/request/command/create-post.command.dto.js';
import { v5 as uuidv5 } from 'uuid';
import { AppConfigService } from '../../../../config/app-config.service.js';

const TEST_POST_NAMESPACE = 'a2d04a60-9d04-4e4b-97e3-0d3f23c7c2b5';

interface MockPostService {
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

interface MockCommentService {
  create: jest.Mock;
  delete: jest.Mock;
  findById: jest.Mock;
}

interface MockStorageClientService {
  confirmPostAttachment: jest.Mock;
}

interface MockAppConfigService {
  postIdNamespace: string;
}

function createMockFileMetadata(overrides: Partial<FileMetadata> = {}): FileMetadata {
  return {
    id: overrides.id ?? 'default-file-id',
    ownerId: overrides.ownerId ?? 'default-owner-id',
    objectKey: overrides.objectKey ?? 'post/file.webp',
    mimeType: overrides.mimeType ?? 'image/jpeg',
    status: overrides.status ?? FileStatus.FILE_STATUS_ATTACHED,
    validationMode: overrides.validationMode ?? ValidationMode.VALIDATION_MODE_SYNC,
    isPublic: overrides.isPublic ?? true,
    uploadExpiresAt: overrides.uploadExpiresAt,
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
    scanStatus: overrides.scanStatus ?? ScanStatus.SCAN_STATUS_CLEAN,
    rejectionReason: overrides.rejectionReason,
    publicUrl: overrides.publicUrl,
    entityType: overrides.entityType,
    entityId: overrides.entityId,
  };
}

function createMockPostMedia(overrides: Partial<PostMediaEntity> = {}): PostMediaEntity {
  const media = new PostMediaEntity();
  media.id = overrides.id ?? 'default-media-id';
  media.postId = overrides.postId ?? 'default-post-id';
  media.fileId = overrides.fileId ?? 'default-file-id';
  media.position = overrides.position ?? 0;
  media.scanStatus = overrides.scanStatus ?? PostMediaScanStatus.CLEAN;
  return media;
}

function createMockPost(overrides: Partial<PostEntity> = {}): PostEntity {
  const post = new PostEntity();
  post.id = overrides.id ?? 'default-post-id';
  post.authorId = overrides.authorId ?? 'default-author-id';
  post.title = overrides.title ?? 'default-title';
  post.content = overrides.content ?? 'default-content';
  post.saga_status = overrides.saga_status ?? SagaStatus.PENDING;
  post.media_status = overrides.media_status ?? PostMediaStatus.NONE;
  post.media = overrides.media ?? [];
  post.createdAt = overrides.createdAt ?? new Date();
  post.updatedAt = overrides.updatedAt ?? new Date();
  if (overrides.eventId) {
    post.eventId = overrides.eventId;
  }
  return post;
}

describe('PostCommandController', () => {
  let controller: PostCommandController;
  let postService: PostService;
  let storageClientService: StorageClientService;

  const mockUser: AuthUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'USER',
  };

  const mockPostService: MockPostService = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCommentService: MockCommentService = {
    create: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
  };

  const mockStorageClientService: MockStorageClientService = {
    confirmPostAttachment: jest.fn(),
  };

  const mockAppConfigService: MockAppConfigService = {
    postIdNamespace: TEST_POST_NAMESPACE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostCommandController],
      providers: [
        PostTransformer,
        {
          provide: PostService,
          useValue: mockPostService,
        },
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
        {
          provide: StorageClientService,
          useValue: mockStorageClientService,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    controller = module.get<PostCommandController>(PostCommandController);
    postService = module.get<PostService>(PostService);
    storageClientService = module.get<StorageClientService>(StorageClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create post without media when fileIds is empty', async () => {
      const dto: CreatePostCommandDTO = {
        title: 'Post Title',
        content: 'Post Content',
        fileIds: [],
        idempotencyKey: 'key-123',
      };

      const expectedPostId = uuidv5(`${mockUser.id}:${dto.idempotencyKey}`, TEST_POST_NAMESPACE);

      const createdEntity = createMockPost({
        id: expectedPostId,
        title: dto.title,
        content: dto.content,
        authorId: mockUser.id,
        media_status: PostMediaStatus.NONE,
        media: [],
      });

      const storageSpy = jest.spyOn(storageClientService, 'confirmPostAttachment');
      const createSpy = jest.spyOn(postService, 'create').mockResolvedValue(createdEntity);

      const result = await controller.createPost(dto, mockUser);

      expect(storageSpy).not.toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedPostId,
          title: dto.title,
          content: dto.content,
          fileIds: [],
          media_status: PostMediaStatus.NONE,
        }),
      );
      expect(result.post).toBeDefined();
      if (!result.post) throw new Error('result.post is undefined');
      expect(result.post.id).toBe(expectedPostId);
      expect(result.post.mediaStatus).toBe(ContractsPostMediaStatus.POST_MEDIA_STATUS_NONE);
      expect(result.post.media).toEqual([]);
    });

    it('should confirm attachments and set READY when all files are clean', async () => {
      const fileId = '22222222-2222-2222-2222-222222222222';
      const dto: CreatePostCommandDTO = {
        title: 'Post With Media',
        content: 'Content with photo',
        fileIds: [fileId],
        idempotencyKey: 'key-with-media',
      };

      const expectedPostId = uuidv5(`${mockUser.id}:${dto.idempotencyKey}`, TEST_POST_NAMESPACE);

      const createdEntity = createMockPost({
        id: expectedPostId,
        title: dto.title,
        content: dto.content,
        authorId: mockUser.id,
        media_status: PostMediaStatus.READY,
        media: [
          createMockPostMedia({
            id: 'media-1',
            postId: expectedPostId,
            fileId,
            position: 0,
            scanStatus: PostMediaScanStatus.CLEAN,
          }),
        ],
      });

      const mockResponse: ConfirmFileAttachmentResponse = {
        success: true,
        updatedCount: 1,
        files: [
          createMockFileMetadata({
            id: fileId,
            ownerId: mockUser.id,
            status: FileStatus.FILE_STATUS_ATTACHED,
            scanStatus: ScanStatus.SCAN_STATUS_CLEAN,
          }),
        ],
      };

      const storageSpy = jest
        .spyOn(storageClientService, 'confirmPostAttachment')
        .mockResolvedValue(mockResponse);
      const createSpy = jest.spyOn(postService, 'create').mockResolvedValue(createdEntity);

      const result = await controller.createPost(dto, mockUser);

      expect(storageSpy).toHaveBeenCalledWith(expectedPostId, [fileId]);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedPostId,
          fileIds: [fileId],
          fileScanStatuses: {
            [fileId]: PostMediaScanStatus.CLEAN,
          },
        }),
      );
      expect(result.post).toBeDefined();
      if (!result.post) throw new Error('result.post is undefined');
      expect(result.post.mediaStatus).toBe(ContractsPostMediaStatus.POST_MEDIA_STATUS_READY);
      expect(result.post.media).toHaveLength(1);
      expect(result.post.media[0]?.fileId).toBe(fileId);
    });

    it('should fall back to async PENDING when storage is unavailable (timeout)', async () => {
      const fileId = '33333333-3333-3333-3333-333333333333';
      const dto: CreatePostCommandDTO = {
        title: 'Post Fallback',
        content: 'Content with timeout',
        fileIds: [fileId],
        idempotencyKey: 'key-timeout',
      };

      const expectedPostId = uuidv5(`${mockUser.id}:${dto.idempotencyKey}`, TEST_POST_NAMESPACE);

      const createdEntity = createMockPost({
        id: expectedPostId,
        title: dto.title,
        content: dto.content,
        authorId: mockUser.id,
        media_status: PostMediaStatus.PENDING,
        media: [],
      });

      const storageSpy = jest
        .spyOn(storageClientService, 'confirmPostAttachment')
        .mockRejectedValue(
          new InternalServerError('timeout', 'STORAGE_TIMEOUT', { timeoutMs: 2000 }),
        );
      const createSpy = jest.spyOn(postService, 'create').mockResolvedValue(createdEntity);

      const result = await controller.createPost(dto, mockUser);

      expect(storageSpy).toHaveBeenCalledWith(expectedPostId, [fileId]);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expectedPostId,
          fileIds: [fileId],
          media_status: PostMediaStatus.PENDING,
        }),
      );
      expect(result.post).toBeDefined();
      if (!result.post) throw new Error('result.post is undefined');
      expect(result.post.mediaStatus).toBe(ContractsPostMediaStatus.POST_MEDIA_STATUS_PENDING);
    });

    it('should rethrow error when storage reservation is rejected (e.g. FILE_NOT_FOUND)', async () => {
      const fileId = '44444444-4444-4444-4444-444444444444';
      const dto: CreatePostCommandDTO = {
        title: 'Post Rejected',
        content: 'Content rejected',
        fileIds: [fileId],
        idempotencyKey: 'key-rejected',
      };

      const expectedPostId = uuidv5(`${mockUser.id}:${dto.idempotencyKey}`, TEST_POST_NAMESPACE);

      const storageSpy = jest
        .spyOn(storageClientService, 'confirmPostAttachment')
        .mockRejectedValue(new NotFoundError(`File with id ${fileId} not found`));
      const createSpy = jest.spyOn(postService, 'create');

      await expect(controller.createPost(dto, mockUser)).rejects.toThrow();
      expect(storageSpy).toHaveBeenCalledWith(expectedPostId, [fileId]);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
