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
import {
  StorageClientService,
  StorageRelayedError,
  FILE_NOT_FOUND,
  INVALID_FILE_ATTACHMENT,
  STORAGE_ATTACHMENT_FAILED,
  STORAGE_TIMEOUT,
} from '@volontariapp/storage-client';
import { ConflictError, GrpcStatus } from '@volontariapp/errors';
import { DATABASE_ERROR } from '@volontariapp/errors-nest';
import { ScanStatus } from '@volontariapp/contracts-nest';
import type { AuthUser } from '@volontariapp/auth';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { v5 as uuidv5 } from 'uuid';
import { PostCommandFactory } from './post-command.factory.js';
import {
  TEST_POST_NAMESPACE,
  createMockAppConfigService,
  createMockCommentService,
  createMockPostService,
  createMockStorageClientService,
} from './post-command.mock.js';

describe('PostCommandController.createPost with images', () => {
  let controller: PostCommandController;
  let postService: PostService;
  let storageClientService: StorageClientService;

  const user: AuthUser = { id: '11111111-1111-1111-1111-111111111111', role: 'USER' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostCommandController],
      providers: [
        PostTransformer,
        { provide: PostService, useValue: createMockPostService() },
        { provide: CommentService, useValue: createMockCommentService() },
        { provide: StorageClientService, useValue: createMockStorageClientService() },
        { provide: AppConfigService, useValue: createMockAppConfigService() },
      ],
    }).compile();

    controller = module.get(PostCommandController);
    postService = module.get(PostService);
    storageClientService = module.get(StorageClientService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('media status handed to the domain once the reservation succeeded', () => {
    it('does not force NONE when every file is CLEAN, so the domain can resolve READY', async () => {
      const fileId = '22222222-2222-2222-2222-222222222222';
      const dto = PostCommandFactory.createCommand({
        fileIds: [fileId],
        idempotencyKey: 'k-clean',
      });
      jest.spyOn(storageClientService, 'confirmPostAttachment').mockResolvedValue(
        PostCommandFactory.createConfirmResponse([
          PostCommandFactory.createFileMetadata({
            id: fileId,
            scanStatus: ScanStatus.SCAN_STATUS_CLEAN,
          }),
        ]),
      );
      const createSpy = jest
        .spyOn(postService, 'create')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ authorId: user.id }));

      await controller.createPost(dto, user);

      const handed = createSpy.mock.calls[0]?.[0];
      expect(handed.media_status).not.toBe(PostMediaStatus.NONE);
    });
  });

  describe('scan status of the files, as delivered by the gRPC client', () => {
    const fileId = '22222222-2222-2222-2222-222222222222';

    it.each([
      [ScanStatus.SCAN_STATUS_CLEAN, PostMediaScanStatus.CLEAN],
      [ScanStatus.SCAN_STATUS_SCANNING, PostMediaScanStatus.SCANNING],
      [ScanStatus.SCAN_STATUS_REJECTED, PostMediaScanStatus.REJECTED],
      ['SCAN_STATUS_CLEAN', PostMediaScanStatus.CLEAN],
      ['SCAN_STATUS_SCANNING', PostMediaScanStatus.SCANNING],
      ['SCAN_STATUS_REJECTED', PostMediaScanStatus.REJECTED],
      ['SCAN_STATUS_AWAITING_UPLOAD', PostMediaScanStatus.AWAITING_UPLOAD],
      ['SCAN_STATUS_UNSPECIFIED', PostMediaScanStatus.AWAITING_UPLOAD],
    ] as const)('hands the domain the scan status for %s', async (scanStatus, expected) => {
      const dto = PostCommandFactory.createCommand({
        fileIds: [fileId],
        idempotencyKey: `k-scan-${String(scanStatus)}`,
      });
      jest
        .spyOn(storageClientService, 'confirmPostAttachment')
        .mockResolvedValue(
          PostCommandFactory.createConfirmResponseOnWire([{ id: fileId, scanStatus }]),
        );
      const createSpy = jest
        .spyOn(postService, 'create')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ authorId: user.id }));

      await controller.createPost(dto, user);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ fileScanStatuses: { [fileId]: expected } }),
      );
    });
  });

  describe('internal token propagation to ms-storage', () => {
    it('forwards the caller internal token with the reservation', async () => {
      const fileId = '22222222-2222-2222-2222-222222222222';
      const dto = PostCommandFactory.createCommand({
        fileIds: [fileId],
        idempotencyKey: 'k-token',
      });
      const postId = uuidv5(`${user.id}:${dto.idempotencyKey}`, TEST_POST_NAMESPACE);
      const storageSpy = jest
        .spyOn(storageClientService, 'confirmPostAttachment')
        .mockResolvedValue(
          PostCommandFactory.createConfirmResponse([
            PostCommandFactory.createFileMetadata({ id: fileId }),
          ]),
        );
      jest
        .spyOn(postService, 'create')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ authorId: user.id }));

      await controller.createPost(dto, user, 'internal-token-abc');

      expect(storageSpy).toHaveBeenCalledWith(postId, [fileId], {
        internalToken: 'internal-token-abc',
      });
    });
  });

  describe('files still being scanned', () => {
    it('hands the SCANNING status to the domain without forcing NONE', async () => {
      const fileId = '55555555-5555-5555-5555-555555555555';
      const dto = PostCommandFactory.createCommand({ fileIds: [fileId], idempotencyKey: 'k-scan' });
      jest.spyOn(storageClientService, 'confirmPostAttachment').mockResolvedValue(
        PostCommandFactory.createConfirmResponse([
          PostCommandFactory.createFileMetadata({
            id: fileId,
            scanStatus: ScanStatus.SCAN_STATUS_SCANNING,
          }),
        ]),
      );
      const createSpy = jest
        .spyOn(postService, 'create')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ authorId: user.id }));

      await controller.createPost(dto, user);

      const handed = createSpy.mock.calls[0]?.[0];
      expect(handed.media_status).not.toBe(PostMediaStatus.NONE);
      expect(handed.fileScanStatuses).toEqual({ [fileId]: PostMediaScanStatus.SCANNING });
    });
  });

  describe('ms-storage unavailable', () => {
    const fileId = '66666666-6666-6666-6666-666666666666';

    it.each([
      ['a client timeout', STORAGE_TIMEOUT('entity', 2000)],
      ['a gRPC UNAVAILABLE', STORAGE_ATTACHMENT_FAILED('entity', 'UNAVAILABLE: no connection')],
      ['a gRPC DEADLINE_EXCEEDED', STORAGE_ATTACHMENT_FAILED('entity', 'DEADLINE_EXCEEDED: late')],
    ])('creates the post as PENDING after %s', async (_label, storageError) => {
      const dto = PostCommandFactory.createCommand({ fileIds: [fileId], idempotencyKey: 'k-down' });
      jest.spyOn(storageClientService, 'confirmPostAttachment').mockRejectedValue(storageError);
      const createSpy = jest
        .spyOn(postService, 'create')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ authorId: user.id }));

      await controller.createPost(dto, user);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ fileIds: [fileId], media_status: PostMediaStatus.PENDING }),
      );
    });
  });

  describe('reservation refused by ms-storage', () => {
    const fileId = '77777777-7777-7777-7777-777777777777';

    it.each([
      ['NOT_FOUND', FILE_NOT_FOUND(fileId)],
      [
        'FAILED_PRECONDITION',
        new StorageRelayedError(
          { statusCode: 422, code: 'FILE_NOT_ATTACHABLE', message: 'File is not attachable' },
          GrpcStatus.FAILED_PRECONDITION,
        ),
      ],
      ['an invalid attachment', INVALID_FILE_ATTACHMENT('wrong entity type')],
    ])('never falls back to async attachment on %s', async (_label, storageError) => {
      const dto = PostCommandFactory.createCommand({
        fileIds: [fileId],
        idempotencyKey: 'k-refuse',
      });
      jest.spyOn(storageClientService, 'confirmPostAttachment').mockRejectedValue(storageError);
      const createSpy = jest.spyOn(postService, 'create');

      await expect(controller.createPost(dto, user)).rejects.toBe(storageError);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('idempotent creation', () => {
    it('derives the same post id from the same owner and idempotency key', async () => {
      const dto = PostCommandFactory.createCommand({ idempotencyKey: 'k-retry' });
      const createSpy = jest
        .spyOn(postService, 'create')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ authorId: user.id }));

      await controller.createPost(dto, user);
      await controller.createPost(dto, user);

      const firstId = createSpy.mock.calls[0]?.[0].id;
      const secondId = createSpy.mock.calls[1]?.[0].id;
      expect(firstId).toBe(uuidv5(`${user.id}:k-retry`, TEST_POST_NAMESPACE));
      expect(secondId).toBe(firstId);
    });

    it('reports a conflict when the domain loses the row it just failed to insert (duplicate title)', async () => {
      const dto = PostCommandFactory.createCommand({ idempotencyKey: 'k-duplicate-title' });
      const wrappedByDomain = DATABASE_ERROR(
        'creating post',
        'Post with id p failed to insert but was not found',
      );
      jest.spyOn(postService, 'create').mockRejectedValue(wrappedByDomain);

      await expect(controller.createPost(dto, user)).rejects.toBeInstanceOf(ConflictError);
    });

    it('rethrows any other domain failure unchanged', async () => {
      const dto = PostCommandFactory.createCommand({ idempotencyKey: 'k-other-failure' });
      const unrelated = DATABASE_ERROR('creating post', 'connection reset');
      jest.spyOn(postService, 'create').mockRejectedValue(unrelated);

      await expect(controller.createPost(dto, user)).rejects.toBe(unrelated);
    });

    it('returns the existing post on a retry without raising POST_ALREADY_EXISTS', async () => {
      const dto = PostCommandFactory.createCommand({ idempotencyKey: 'k-replay' });
      const postId = uuidv5(`${user.id}:${dto.idempotencyKey}`, TEST_POST_NAMESPACE);
      jest
        .spyOn(postService, 'create')
        .mockResolvedValue(PostCommandFactory.createPostEntity({ id: postId, authorId: user.id }));

      const first = await controller.createPost(dto, user);
      const second = await controller.createPost(dto, user);

      expect(second.post?.id).toBe(postId);
      expect(second.post?.id).toBe(first.post?.id);
    });
  });
});
