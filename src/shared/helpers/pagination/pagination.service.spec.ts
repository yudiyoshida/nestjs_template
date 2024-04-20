import { TestBed } from '@automock/jest';
import { PaginationService } from './pagination.service';

const data = [1, 2, 3, 4, 5];

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(() => {
    const { unit } = TestBed.create(PaginationService).compile();

    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all items in the first page', () => {
    // Act
    const result = service.execute([data, data.length], 1, 10);

    // Assert
    expect(result.data).toIncludeSameMembers(data);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(1);
  });

  it('should return no items in the second page', () => {
    // Act
    const result = service.execute([[], data.length], 2, 10);

    // Assert
    expect(result.data).toBeArrayOfSize(0);
    expect(result.currentPage).toBe(2);
    expect(result.itemsPerPage).toBe(10);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(1);
  });

  it('should return first two items in the first page', () => {
    // Arrange
    const subdata = data.slice(0, 2);

    // Act
    const result = service.execute([subdata, data.length], 1, 2);

    // Assert
    expect(result.data).toIncludeSameMembers(subdata);
    expect(result.currentPage).toBe(1);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should return the last item in the third page', () => {
    // Arrange
    const subdata = data.slice(-1);

    // Act
    const result = service.execute([subdata, data.length], 3, 2);

    // Assert
    expect(result.data).toIncludeSameMembers(subdata);
    expect(result.currentPage).toBe(3);
    expect(result.itemsPerPage).toBe(2);
    expect(result.totalItems).toBe(5);
    expect(result.totalPages).toBe(3);
  });
});
