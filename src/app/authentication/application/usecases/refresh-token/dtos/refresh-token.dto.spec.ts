import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { pipeOptions } from 'src/infra/validators/class/config';
import { RefreshTokenInputDto } from './refresh-token.dto';

const metadata: ArgumentMetadata = {
  type: 'body',
  metatype: RefreshTokenInputDto,
};

describe('RefreshTokenInputDto - Unit tests', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('refreshToken field', () => {
    it.each(
      [
        undefined,
        null,
        '',
        '  ',
      ]
    )('should throw an error if refreshToken is empty (%s)', async(value: unknown) => {
      // Arrange
      const data = { refreshToken: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('refreshToken é obrigatório');
      });
    });

    it.each(
      [
        123,
        true,
        false,
        {},
        [],
      ]
    )('should throw an error if refreshToken is not a string (%s)', async(value: unknown) => {
      // Arrange
      const data = { refreshToken: value };

      // Act & Assert
      expect.assertions(1);
      return target.transform(data, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('refreshToken deve ser uma string');
      });
    });
  });

  it('should pass if refreshToken is valid', async() => {
    // Arrange
    const data = {
      refreshToken: 'valid.refresh.token',
    };

    // Act
    const result = await target.transform(data, metadata);

    // Assert
    expect(result).toBeInstanceOf(RefreshTokenInputDto);
    expect(result).toEqual(data);
  });
});
