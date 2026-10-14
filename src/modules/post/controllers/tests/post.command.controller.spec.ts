import { Test, TestingModule } from '@nestjs/testing';
import { PostCommandController } from '../post.command.controller.js';
import {
  PostService,
  CommentService,
  PostEntity,
  PostMediaStatus,
  PostMediaScanStatus,
} from '@volontariapp/domain-post';
import { PostTransformer } from '../../transformers/index.js';
import { StorageClientService } from '@volontariapp/storage-client';
import {
  ScanStatus,
  PostMediaStatus as ContractsPostMediaStatus,
} from '@volontariapp/contracts-nest';
import { NotFoundError, InternalServerError } from '@volontariapp/errors';
import type { AuthUser } from '@volontariapp/auth';
import { CreatePostCommandDTO } from '../../dto/request/command/create-post.command.dto.js';
import { v5 as uuidv5 } from 'uuid';
import { AppConfigService } from '../../../../config/app-config.service.js';

const TEST_POST_NAMESPACE = 'a2d04a60-9d04-4e4b-97e3-0d3f23c7c2b5';

describe('PostCommandController', () => {
  let controller: PostCommandController;
  let postService: PostService;
  let commentService: CommentService;
  let storageClientService: StorageClientService;
  let postTransformer: PostTransformer;

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
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CommentService,
          useValue: {
            create: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: StorageClientService,
          useValue: {
            confirmPostAttachment: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            postIdNamespace: TEST_POST_NAMESPACE,
          },
        },
      ],
    }).compile();

    controller = module.get<PostCommandController>(PostCommandController);
    postService = module.get<PostService>(PostService);
    commentService = module.get<CommentService>(CommentService);
    storageClientService = module.get<StorageClientService>(StorageClientService);
    postTransformer = module.get<PostTransformer>(PostTransformer);
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

      const createdEntity = new PostEntity();
      createdEntity.id = expectedPostId;
      createdEntity.title = dto.title;
      createdEntity.content = dto.content;
      createdEntity.authorId = mockUser.id;
      createdEntity.media_status = PostMediaStatus.NONE;
      createdEntity.media = [];
      createdEntity.createdAt = new Date();
      createdEntity.updatedAt = new Date();

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

      const createdEntity = new PostEntity();
      createdEntity.id = expectedPostId;
      createdEntity.title = dto.title;
      createdEntity.content = dto.content;
      createdEntity.authorId = mockUser.id;
      createdEntity.media_status = PostMediaStatus.READY;
      createdEntity.media = [
        {
          id: 'media-1',
          postId: expectedPostId,
          fileId,
          position: 0,
          scanStatus: PostMediaScanStatus.CLEAN,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      createdEntity.createdAt = new Date();
      createdEntity.updatedAt = new Date();

      const storageSpy = jest
        .spyOn(storageClientService, 'confirmPostAttachment')
        .mockResolvedValue({
          success: true,
          updatedCount: 1,
          files: [
            {
              id: fileId,
              ownerId: mockUser.id,
              objectKey: 'post/file.webp',
              mimeType: 'image/jpeg',
              status: 2, // ATTACHED
              isPublic: true,
              uploadExpiresAt: undefined,
              createdAt: undefined,
              updatedAt: undefined,
              scanStatus: ScanStatus.SCAN_STATUS_CLEAN,
            },
          ],
        });
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
      expect(result.post.mediaStatus).toBe(ContractsPostMediaStatus.POST_MEDIA_STATUS_READY);
      expect(result.post.media).toHaveLength(1);
      expect(result.post.media[0].fileId).toBe(fileId);
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

      const createdEntity = new PostEntity();
      createdEntity.id = expectedPostId;
      createdEntity.title = dto.title;
      createdEntity.content = dto.content;
      createdEntity.authorId = mockUser.id;
      createdEntity.media_status = PostMediaStatus.PENDING;
      createdEntity.media = [];
      createdEntity.createdAt = new Date();
      createdEntity.updatedAt = new Date();

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

      jest
        .spyOn(storageClientService, 'confirmPostAttachment')
        .mockRejectedValue(new NotFoundError(`File with id ${fileId} not found`));
      const createSpy = jest.spyOn(postService, 'create');

      await expect(controller.createPost(dto, mockUser)).rejects.toThrow();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });
});
