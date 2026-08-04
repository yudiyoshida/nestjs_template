import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllFaqQueryDto } from './find-all-faq.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllFaqQueryDto,
};

describe('FindAllFaqQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  it('should pass with no fields provided', async() => {
    // Arrange
    const query = {};

    // Act
    const result = await target.transform(query, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllFaqQueryDto);
    expect(result).toEqual({});
  });

  it('should accept the inherited page, size and search fields', async() => {
    // Arrange
    const query = { page: '1', size: '10', search: 'senha' };

    // Act
    const result = await target.transform(query, metadata);

    // Assert
    expect(result).toBeInstanceOf(FindAllFaqQueryDto);
    expect(result).toEqual({ page: 1, size: 10, search: 'senha' });
  });

  it('should throw an error if page is not positive, same as the inherited Queries DTO', async() => {
    // Arrange
    const query = { page: '-1' };

    // Act & Assert
    expect.assertions(1);
    return target.transform(query, metadata).catch((error) => {
      expect(error.getResponse().message).toContain('page deve ser um número positivo');
    });
  });
});
