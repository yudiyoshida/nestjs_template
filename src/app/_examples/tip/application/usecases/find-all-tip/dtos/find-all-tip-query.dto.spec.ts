import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { TipStatus } from 'src/app/_examples/tip/domain/enums/tip-status.enum';
import { TipType } from 'src/app/_examples/tip/domain/enums/tip-type.enum';
import { pipeOptions } from 'src/infra/validators/class/config';
import { FindAllTipQueryDto } from './find-all-tip-query.dto';

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindAllTipQueryDto,
};

function makeValidQuery(overrides: Partial<FindAllTipQueryDto> = {}): FindAllTipQueryDto {
  return {
    ...overrides,
  };
}

describe('FindAllTipQueryDto', () => {
  let target: ValidationPipe;

  beforeEach(() => {
    target = new ValidationPipe(pipeOptions);
  });

  describe('type field', () => {
    it('should be optional', async() => {
      const query = makeValidQuery({ type: undefined });

      const result = await target.transform(query, metadata);

      expect(result.type).toBeUndefined();
    });

    it.each([
      Object.values(TipType),
    ])('should accept valid type (%s)', async(value) => {
      const query = makeValidQuery({ type: value });

      const result = await target.transform(query, metadata);

      expect(result.type).toBe(value);
    });

    it('should throw an error if type is invalid', async() => {
      const query = makeValidQuery({ type: 'INVALID_TYPE' as any });

      expect.assertions(1);
      return target.transform(query, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type must be a valid enum value');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if type is not a valid enum value (%s)', async(value: any) => {
      const query = makeValidQuery({ type: value });

      expect.assertions(1);
      return target.transform(query, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('type must be a valid enum value');
      });
    });
  });

  describe('status field', () => {
    it('should be optional', async() => {
      const query = makeValidQuery({ status: undefined });

      const result = await target.transform(query, metadata);

      expect(result.status).toBeUndefined();
    });

    it.each([
      Object.values(TipStatus),
    ])('should accept valid status (%s)', async(value: TipStatus) => {
      const query = makeValidQuery({ status: value });

      const result = await target.transform(query, metadata);

      expect(result.status).toBe(value);
    });

    it('should throw an error if status is invalid', async() => {
      const query = makeValidQuery({ status: 'INVALID_STATUS' as any });

      expect.assertions(1);
      return target.transform(query, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('status must be a valid enum value');
      });
    });

    it.each([
      123,
      true,
      false,
      {},
      [],
    ])('should throw an error if status is not a valid enum value (%s)', async(value: any) => {
      const query = makeValidQuery({ status: value });

      expect.assertions(1);
      return target.transform(query, metadata).catch((error) => {
        expect(error.getResponse().message).toContain('status must be a valid enum value');
      });
    });
  });

  describe('locationId field', () => {
    it('should be optional', async() => {
      const query = makeValidQuery({ locationId: undefined });

      const result = await target.transform(query, metadata);

      expect(result.locationId).toBeUndefined();
    });

    it('should accept valid UUID for locationId', async() => {
      const query = makeValidQuery({ locationId: '123e4567-e89b-12d3-a456-426614174000' });

      const result = await target.transform(query, metadata);

      expect(result.locationId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  describe('all fields validation', () => {
    it('should pass with empty query', async() => {
      const query = makeValidQuery({});

      const result = await target.transform(query, metadata);

      expect(result).toBeInstanceOf(FindAllTipQueryDto);
    });

    it('should pass with all optional fields', async() => {
      const query = makeValidQuery({
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        locationId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const result = await target.transform(query, metadata);

      expect(result.type).toBe(TipType.WEATHER);
      expect(result.status).toBe(TipStatus.ACTIVE);
      expect(result.locationId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });
  });
});
