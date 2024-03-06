import { IsPositiveIntegerNumber } from './positive-int-number';

describe('IsPositiveIntegerNumber', () => {
  it('should return false when not providing a value', () => {
    const result = new IsPositiveIntegerNumber().validate(undefined);

    expect(result).toBeFalse();
  });

  it('should return false when not providing null to value', () => {
    const result = new IsPositiveIntegerNumber().validate(null);

    expect(result).toBeFalse();
  });

  it('should return false when providing a boolean to value', () => {
    const result = new IsPositiveIntegerNumber().validate(true);

    expect(result).toBeFalse();
  });

  it('should return false when providing an object to value', () => {
    const result = new IsPositiveIntegerNumber().validate({});

    expect(result).toBeFalse();
  });

  it('should return false when providing an array to value', () => {
    const result = new IsPositiveIntegerNumber().validate([]);

    expect(result).toBeFalse();
  });

  it('should return false when providing a negative integer number to value (as string)', () => {
    const result = new IsPositiveIntegerNumber().validate('-10');

    expect(result).toBeFalse();
  });

  it('should return false when providing a negative decimal number to value (as string)', () => {
    const result = new IsPositiveIntegerNumber().validate('-1.89');

    expect(result).toBeFalse();
  });

  it('should return false when providing a zero to value (as string)', () => {
    const result = new IsPositiveIntegerNumber().validate('0');

    expect(result).toBeFalse();
  });

  it('should return false when providing a positive decimal number to value (as string)', () => {
    const result = new IsPositiveIntegerNumber().validate('1.01');

    expect(result).toBeFalse();
  });

  it('should return true when providing a positive integer number to value (as string)', () => {
    const result = new IsPositiveIntegerNumber().validate('15');

    expect(result).toBeTrue();
  });

  it('should return false when providing a negative integer number to value (as number)', () => {
    const result = new IsPositiveIntegerNumber().validate(-10);

    expect(result).toBeFalse();
  });

  it('should return false when providing a negative decimal number to value (as number)', () => {
    const result = new IsPositiveIntegerNumber().validate(-1.89);

    expect(result).toBeFalse();
  });

  it('should return false when providing a zero to value (as number)', () => {
    const result = new IsPositiveIntegerNumber().validate(0);

    expect(result).toBeFalse();
  });

  it('should return false when providing a positive decimal number to value (as number)', () => {
    const result = new IsPositiveIntegerNumber().validate(1.01);

    expect(result).toBeFalse();
  });

  it('should return true when providing a positive integer number to value (as number)', () => {
    const result = new IsPositiveIntegerNumber().validate(15);

    expect(result).toBeTrue();
  });
});
