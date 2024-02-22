import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
  let service: PaginationService;

  const data = [1, 2, 3, 4, 5];

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationService],
    }).compile();

    service = module.get<PaginationService>(PaginationService);
  });

  it('should return all data in the first page', () => {
    const result = service.execute([data, data.length], 1, 10);

    expect(result.data).toIncludeSameMembers(data);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(1);
  });

  it('should return first two datas in the first page', () => {
    const subdata = data.slice(0, 2);

    const result = service.execute([subdata, data.length], 1, 2);

    expect(result.data).toIncludeSameMembers(subdata);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should return no data in the second page', () => {
    const result = service.execute([[], data.length], 2, 10);

    expect(result.data).toBeArrayOfSize(0);
    expect(result.currentPage).toBe(2);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(1);
  });
});
