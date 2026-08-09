import { Pagination } from './pagination.vo';

describe('Pagination - Unit tests', () => {
  describe('constructor', () => {
    describe('Happy path', () => {
      it('should use provided page and size when both are given', () => {
        // Arrange
        const sut = new Pagination(['a', 'b'], 20, 2, 5);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result.currentPage).toBe(2);
        expect(result.itemsPerPage).toBe(5);
      });
    });

    describe('Edge cases', () => {
      it('should default page to 1 when page is not provided', () => {
        // Arrange
        const sut = new Pagination(['a'], 10);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result.currentPage).toBe(1);
      });

      it('should default size to total when size is not provided', () => {
        // Arrange
        const sut = new Pagination(['a'], 10);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result.itemsPerPage).toBe(10);
      });

      it('should keep page 0 when page is explicitly 0', () => {
        // Arrange
        const sut = new Pagination(['a'], 10, 0);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result.currentPage).toBe(0);
      });

      it('should keep size 0 when size is explicitly 0', () => {
        // Arrange
        const sut = new Pagination(['a'], 10, 1, 0);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result.itemsPerPage).toBe(0);
      });
    });
  });

  describe('getDto', () => {
    describe('Happy path', () => {
      it('should return dto with currentPage, itemsPerPage, totalItems and data matching constructor input', () => {
        // Arrange
        const data = ['a', 'b', 'c'];
        const sut = new Pagination(data, 30, 2, 10);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result).toEqual({
          currentPage: 2,
          itemsPerPage: 10,
          totalItems: 30,
          totalPages: 3,
          data,
        });
      });
    });

    describe('Edge cases', () => {
      it.each([
        [0, 30, 0],
        [0, 0, 10],
        [3, 30, 10],
        [3, 25, 10],
        [1, 5, 10],
      ])('should calculate totalPages as %s when total is %s and size is %s', (expected: number, total: number, size: number) => {
        // Arrange
        const sut = new Pagination(['a'], total, 1, size);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result.totalPages).toBe(expected);
      });

      it('should return empty data array when data is empty array', () => {
        // Arrange
        const sut = new Pagination([], 0, 1, 10);

        // Act
        const result = sut.getDto();

        // Assert
        expect(result.data).toEqual([]);
      });
    });
  });
});
