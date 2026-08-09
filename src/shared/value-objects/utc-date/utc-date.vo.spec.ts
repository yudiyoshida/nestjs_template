import {
  InvalidDateError,
  InvalidDaysQuantityError,
  InvalidMonthsQuantityError,
} from './utc-date.error';
import { UTCDate } from './utc-date.vo';

describe('UTCDate - Unit tests', () => {
  describe('create', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    describe('Happy path', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-03-10T12:00:00.000Z'));
      });

      it('should return a UTCDate instance', () => {
        // Act
        const sut = UTCDate.create();

        // Assert
        expect(sut).toBeInstanceOf(UTCDate);
      });

      it('should set value to the current UTC time when system time is frozen', () => {
        // Arrange
        const expected = new Date('2024-03-10T12:00:00.000Z');

        // Act
        const sut = UTCDate.create();

        // Assert
        expect(sut.value.getTime()).toBe(expected.getTime());
      });
    });
  });

  describe('from', () => {
    describe('Happy path', () => {
      it('should create a UTCDate preserving the exact timestamp from a valid Date', () => {
        // Arrange
        const input = new Date('2024-06-15T08:30:45.123Z');

        // Act
        const sut = UTCDate.from(input);

        // Assert
        expect(sut.value.getTime()).toBe(input.getTime());
      });

      it('should preserve the instant for a date created with a local offset', () => {
        // Arrange
        const input = new Date('2024-01-15T00:00:00-03:00');

        // Act
        const sut = UTCDate.from(input);

        // Assert
        expect(sut.value.toISOString()).toBe('2024-01-15T03:00:00.000Z');
      });
    });

    describe('Error path', () => {
      it.each([
        null,
        undefined,
        new Date('invalid'),
        'invalid' as any,
        {} as any,
        123 as any,
      ])('should throw InvalidDateError when providing an invalid value (%s)', (value: any) => {
        // Act & Assert
        expect(() => UTCDate.from(value)).toThrow(InvalidDateError);
      });
    });

    describe('Edge cases', () => {
      it('should create a UTCDate from the Unix epoch', () => {
        // Arrange
        const input = new Date(0);

        // Act
        const sut = UTCDate.from(input);

        // Assert
        expect(sut.value.getTime()).toBe(0);
        expect(sut.isoString).toBe('1970-01-01');
      });

      it('should create a UTCDate from a far-future date', () => {
        // Arrange
        const input = new Date('2099-12-31T23:59:59.999Z');

        // Act
        const sut = UTCDate.from(input);

        // Assert
        expect(sut.isoString).toBe('2099-12-31');
      });
    });
  });

  describe('value', () => {
    describe('Happy path', () => {
      it('should return a Date equal to the source instant', () => {
        // Arrange
        const input = new Date('2024-05-20T14:00:00.000Z');
        const sut = UTCDate.from(input);

        // Act
        const result = sut.value;

        // Assert
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(input.getTime());
      });
    });

    describe('Edge cases', () => {
      it('should return a fresh Date on each access so mutating it does not change the value object', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-05-20T14:00:00.000Z'));
        const first = sut.value;
        const originalTime = first.getTime();

        // Act
        first.setFullYear(1999);
        const second = sut.value;

        // Assert
        expect(second.getTime()).toBe(originalTime);
      });
    });
  });

  describe('isoString', () => {
    describe('Happy path', () => {
      it('should return the date portion in YYYY-MM-DD format', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-06-15T08:30:45.123Z'));

        // Act
        const result = sut.isoString;

        // Assert
        expect(result).toBe('2024-06-15');
      });
    });

    describe('Edge cases', () => {
      it('should return the same calendar day when the instant is 23:59:59.999Z', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T23:59:59.999Z'));

        // Act
        const result = sut.isoString;

        // Assert
        expect(result).toBe('2024-03-10');
      });

      it('should return the same calendar day when the instant is 00:00:00.000Z', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T00:00:00.000Z'));

        // Act
        const result = sut.isoString;

        // Assert
        expect(result).toBe('2024-03-10');
      });

      it('should zero-pad single-digit month and day', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-01-05T12:00:00.000Z'));

        // Act
        const result = sut.isoString;

        // Assert
        expect(result).toBe('2024-01-05');
      });
    });
  });

  describe('addDays', () => {
    describe('Happy path', () => {
      it('should add one day to the current value', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act
        const result = sut.addDays(1);

        // Assert
        expect(result.isoString).toBe('2024-03-11');
      });

      it('should add thirty days to the current value', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act
        const result = sut.addDays(30);

        // Assert
        expect(result.isoString).toBe('2024-04-09');
      });

      it('should return a new instance without mutating the original', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act
        const result = sut.addDays(1);

        // Assert
        expect(result).not.toBe(sut);
        expect(sut.isoString).toBe('2024-03-10');
      });
    });

    describe('Error path', () => {
      it.each([
        0,
        -1,
        -30,
        0.5,
        1.5,
        NaN,
        Infinity,
        -Infinity,
        null,
        undefined,
      ])('should throw InvalidDaysQuantityError when days is invalid (%s)', (days: any) => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act & Assert
        expect(() => sut.addDays(days)).toThrow(InvalidDaysQuantityError);
      });
    });

    describe('Edge cases', () => {
      it('should cross a month boundary when adding days', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-01-31T12:00:00.000Z'));

        // Act
        const result = sut.addDays(1);

        // Assert
        expect(result.isoString).toBe('2024-02-01');
      });

      it('should cross a year boundary when adding days', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-12-31T12:00:00.000Z'));

        // Act
        const result = sut.addDays(1);

        // Assert
        expect(result.isoString).toBe('2025-01-01');
      });

      it('should land on Feb 29 when adding one day after Feb 28 in a leap year', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-02-28T12:00:00.000Z'));

        // Act
        const result = sut.addDays(1);

        // Assert
        expect(result.isoString).toBe('2024-02-29');
      });

      it('should add 366 days correctly', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-01-01T12:00:00.000Z'));

        // Act
        const result = sut.addDays(366);

        // Assert
        expect(result.isoString).toBe('2025-01-01');
      });
    });
  });

  describe('addMonths', () => {
    describe('Happy path', () => {
      it('should add one month to the current value', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act
        const result = sut.addMonths(1);

        // Assert
        expect(result.isoString).toBe('2024-04-10');
      });

      it('should add twelve months to the current value', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act
        const result = sut.addMonths(12);

        // Assert
        expect(result.isoString).toBe('2025-03-10');
      });

      it('should return a new instance without mutating the original', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act
        const result = sut.addMonths(1);

        // Assert
        expect(result).not.toBe(sut);
        expect(sut.isoString).toBe('2024-03-10');
      });
    });

    describe('Error path', () => {
      it.each([
        0,
        -1,
        -30,
        0.5,
        1.5,
        NaN,
        Infinity,
        -Infinity,
        null,
        undefined,
      ])('should throw InvalidMonthsQuantityError when months is invalid (%s)', (months: any) => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-03-10T12:00:00.000Z'));

        // Act & Assert
        expect(() => sut.addMonths(months)).toThrow(InvalidMonthsQuantityError);
      });
    });

    describe('Edge cases', () => {
      it('should clamp to the last day of February when adding one month from Jan 31 in a leap year', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-01-31T12:00:00.000Z'));

        // Act
        const result = sut.addMonths(1);

        // Assert
        expect(result.isoString).toBe('2024-02-29');
      });

      it('should clamp to the last day of February when adding one month from Jan 31 in a non-leap year', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2023-01-31T12:00:00.000Z'));

        // Act
        const result = sut.addMonths(1);

        // Assert
        expect(result.isoString).toBe('2023-02-28');
      });

      it('should roll into the next year when adding one month from December', () => {
        // Arrange
        const sut = UTCDate.from(new Date('2024-12-15T12:00:00.000Z'));

        // Act
        const result = sut.addMonths(1);

        // Assert
        expect(result.isoString).toBe('2025-01-15');
      });
    });
  });

  describe('isBefore', () => {
    let sut: UTCDate;
    let reference: UTCDate;

    beforeEach(() => {
      sut = UTCDate.from(new Date('2024-06-15T12:00:00.000Z'));
      reference = UTCDate.from(new Date('2024-06-15T12:00:00.000Z'));
    });

    describe('Happy path', () => {
      it('should return true when this date is earlier than the other', () => {
        // Arrange
        const earlier = UTCDate.from(new Date('2024-06-14T12:00:00.000Z'));

        // Act
        const result = earlier.isBefore(reference);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when this date is later than the other', () => {
        // Arrange
        const later = UTCDate.from(new Date('2024-06-16T12:00:00.000Z'));

        // Act
        const result = later.isBefore(reference);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when dates are equal and inclusive is false by default', () => {
        // Act
        const result = sut.isBefore(reference);

        // Assert
        expect(result).toBe(false);
      });

      it('should return true when dates are equal and inclusive is true', () => {
        // Act
        const result = sut.isBefore(reference, true);

        // Assert
        expect(result).toBe(true);
      });

      it('should return true when this date is earlier and inclusive is true', () => {
        // Arrange
        const earlier = UTCDate.from(new Date('2024-06-14T12:00:00.000Z'));

        // Act
        const result = earlier.isBefore(reference, true);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when this date is later and inclusive is true', () => {
        // Arrange
        const later = UTCDate.from(new Date('2024-06-16T12:00:00.000Z'));

        // Act
        const result = later.isBefore(reference, true);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('Error path', () => {
      it.each([
        null,
        undefined,
        new Date() as any,
        {} as any,
        '2024-01-01' as any,
      ])('should throw InvalidDateError when date argument is invalid (%s)', (date: any) => {
        // Act & Assert
        expect(() => sut.isBefore(date)).toThrow(InvalidDateError);
      });
    });

    describe('Edge cases', () => {
      it('should return true when this date is one millisecond earlier', () => {
        // Arrange
        const earlier = UTCDate.from(new Date('2024-06-15T11:59:59.999Z'));

        // Act
        const result = earlier.isBefore(reference);

        // Assert
        expect(result).toBe(true);
      });
    });
  });

  describe('isAfter', () => {
    let sut: UTCDate;
    let reference: UTCDate;

    beforeEach(() => {
      sut = UTCDate.from(new Date('2024-06-15T12:00:00.000Z'));
      reference = UTCDate.from(new Date('2024-06-15T12:00:00.000Z'));
    });

    describe('Happy path', () => {
      it('should return true when this date is later than the other', () => {
        // Arrange
        const later = UTCDate.from(new Date('2024-06-16T12:00:00.000Z'));

        // Act
        const result = later.isAfter(reference);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when this date is earlier than the other', () => {
        // Arrange
        const earlier = UTCDate.from(new Date('2024-06-14T12:00:00.000Z'));

        // Act
        const result = earlier.isAfter(reference);

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when dates are equal and inclusive is false by default', () => {
        // Act
        const result = sut.isAfter(reference);

        // Assert
        expect(result).toBe(false);
      });

      it('should return true when dates are equal and inclusive is true', () => {
        // Act
        const result = sut.isAfter(reference, true);

        // Assert
        expect(result).toBe(true);
      });

      it('should return true when this date is later and inclusive is true', () => {
        // Arrange
        const later = UTCDate.from(new Date('2024-06-16T12:00:00.000Z'));

        // Act
        const result = later.isAfter(reference, true);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when this date is earlier and inclusive is true', () => {
        // Arrange
        const earlier = UTCDate.from(new Date('2024-06-14T12:00:00.000Z'));

        // Act
        const result = earlier.isAfter(reference, true);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('Error path', () => {
      it.each([
        null,
        undefined,
        new Date() as any,
        {} as any,
        '2024-01-01' as any,
      ])('should throw InvalidDateError when date argument is invalid (%s)', (date: any) => {
        // Act & Assert
        expect(() => sut.isAfter(date)).toThrow(InvalidDateError);
      });
    });

    describe('Edge cases', () => {
      it('should return true when this date is one millisecond later', () => {
        // Arrange
        const later = UTCDate.from(new Date('2024-06-15T12:00:00.001Z'));

        // Act
        const result = later.isAfter(reference);

        // Assert
        expect(result).toBe(true);
      });
    });
  });
});
