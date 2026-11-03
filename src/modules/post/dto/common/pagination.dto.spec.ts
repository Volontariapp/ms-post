import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MAX_PAGINATION_LIMIT, PaginationRequestDTO } from './pagination.dto.js';

const errorsFor = async (page: number, limit: number): Promise<string[]> => {
  const dto = plainToInstance(PaginationRequestDTO, { page, limit });
  const errors = await validate(dto);
  return errors.map((error) => error.property);
};

describe('PaginationRequestDTO', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('expose un plafond de 100', () => {
    expect(MAX_PAGINATION_LIMIT).toBe(100);
  });

  it.each([
    [1, 10],
    [1, 100],
    [3, 1],
  ])('accepte page=%d limit=%d', async (page, limit) => {
    await expect(errorsFor(page, limit)).resolves.toEqual([]);
  });

  it('refuse limit au dessus du plafond', async () => {
    await expect(errorsFor(1, MAX_PAGINATION_LIMIT + 1)).resolves.toEqual(['limit']);
  });

  it('refuse page 0', async () => {
    await expect(errorsFor(0, 10)).resolves.toEqual(['page']);
  });

  it('refuse limit 0', async () => {
    await expect(errorsFor(1, 0)).resolves.toEqual(['limit']);
  });

  it('refuse limit non entier', async () => {
    await expect(errorsFor(1, 2.5)).resolves.toEqual(['limit']);
  });
});
