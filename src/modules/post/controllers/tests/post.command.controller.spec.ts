import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PostCommandController } from '../post.command.controller.js';
import {
  PostService,
  CommentService,
  PostMediaStatus,
  PostMediaScanStatus,
} from '@volontariapp/domain-post';
import { PostTransformer } from '../../transformers/index.js';
import { StorageClientService } from '@volontariapp/storage-client';
import {
  FileStatus,
  ScanStatus,
  PostMediaStatus as ContractsPostMediaStatus,
  type ConfirmFileAttachmentResponse,
} from '@volontariapp/contracts-nest';
import { NotFoundError, InternalServerError } from '@volontariapp/errors';
import type { AuthUser } from '@volontariapp/auth';
import type { CreatePostCommandDTO } from '../../dto/request/command/create-post.command.dto.js';
import { v5 as uuidv5 } from 'uuid';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { PostCommandFactory } from './post-command.factory.js';
import {
  TEST_POST_NAMESPACE,
  createMockAppConfigService,
  createMockCommentService,
  createMockPostService,
  createMockStorageClientService,
} from './post-command.mock.js';

describe('PostCommandController', () => {
  let controller: PostCommandController;
  let postService: PostService;
  let storageClientService: StorageClientService;

  const mockUser: AuthUser = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostCommandController],
      providers: [
        PostTransformer,
        {
          provide: PostService,
          useValue: createMockPostService(),
        },
        {
          provide: CommentService,
          useValue: createMockCommentService(),
        },
        {
          provide: StorageClientService,
          useValue: createMockStorageClientService(),
        },
        {
          provide: AppConfigService,
          useValue: createMockAppConfigService(),
        },
      ],
    }).compile();

    controller = module.get<PostCommandController>(PostCommandController);
    postService = module.get<PostService>(PostService);
    storageClientService = module.get<StorageClientService>(StorageClientService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

      const createdEntity = PostCommandFactory.createPostEntity({
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

      const createdEntity = PostCommandFactory.createPostEntity({
        id: expectedPostId,
        title: dto.title,
        content: dto.content,
        authorId: mockUser.id,
        media_status: PostMediaStatus.READY,
        media: [
          PostCommandFactory.createPostMedia({
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
          PostCommandFactory.createFileMetadata({
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

      expect(storageSpy).toHaveBeenCalledWith(expectedPostId, [fileId], undefined);
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

      const createdEntity = PostCommandFactory.createPostEntity({
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

      expect(storageSpy).toHaveBeenCalledWith(expectedPostId, [fileId], undefined);
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
      expect(storageSpy).toHaveBeenCalledWith(expectedPostId, [fileId], undefined);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
