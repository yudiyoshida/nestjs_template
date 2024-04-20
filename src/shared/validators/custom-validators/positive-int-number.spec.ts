import { IsPositiveIntegerNumber } from './positive-int-number';

describe('IsPositiveIntegerNumber', () => {
  it('should return false when not providing a value', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(undefined);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing null to value', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(null);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing a boolean to value', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(true);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing an object to value', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate({});

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing an array to value', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate([]);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing a negative integer number to value (as string)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate('-10');

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing a negative decimal number to value (as string)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate('-1.89');

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing zero to value (as string)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate('0');

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing a positive decimal number to value (as string)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate('1.01');

    // Assert
    expect(result).toBeFalse();
  });

  it('should return true when providing a positive integer number to value (as string)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate('15');

    // Assert
    expect(result).toBeTrue();
  });

  it('should return false when providing a negative integer number to value (as number)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(-10);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing a negative decimal number to value (as number)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(-1.89);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing zero to value (as number)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(0);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false when providing a positive decimal number to value (as number)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(1.01);

    // Assert
    expect(result).toBeFalse();
  });

  it('should return true when providing a positive integer number to value (as number)', () => {
    // Act
    const result = new IsPositiveIntegerNumber().validate(15);

    // Assert
    expect(result).toBeTrue();
  });
});
