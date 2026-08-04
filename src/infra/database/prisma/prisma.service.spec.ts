import { PrismaService } from './prisma.service';

describe('PrismaService - Unit tests', () => {
  let sut: PrismaService;

  beforeEach(() => {
    sut = new PrismaService();
  });

  describe('paginationFactory', () => {
    it('should calculate skip and take when page and size are provided', () => {
      // Act
      const result = sut.paginationFactory(2, 10);

      // Assert
      expect(result).toEqual({ skip: 10, take: 10 });
    });

    it('should calculate skip as 0 for the first page', () => {
      // Act
      const result = sut.paginationFactory(1, 10);

      // Assert
      expect(result).toEqual({ skip: 0, take: 10 });
    });

    it('should return undefined skip/take when page is not provided', () => {
      // Act
      const result = sut.paginationFactory(undefined, 10);

      // Assert
      expect(result).toEqual({ skip: undefined, take: undefined });
    });

    it('should return undefined skip/take when size is not provided', () => {
      // Act
      const result = sut.paginationFactory(2, undefined);

      // Assert
      expect(result).toEqual({ skip: undefined, take: undefined });
    });

    it('should return undefined skip/take when neither page nor size is provided', () => {
      // Act
      const result = sut.paginationFactory();

      // Assert
      expect(result).toEqual({ skip: undefined, take: undefined });
    });

    it('should calculate skip for a page beyond the first', () => {
      // Act
      const result = sut.paginationFactory(3, 25);

      // Assert
      expect(result).toEqual({ skip: 50, take: 25 });
    });
  });
});
