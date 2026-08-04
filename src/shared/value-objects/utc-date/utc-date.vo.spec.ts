import { InvalidDateError, InvalidDaysQuantityError, InvalidMonthsQuantityError } from './utc-date.error';
import { UTCDate } from './utc-date.vo';

describe('UTCDate - Unit tests', () => {
  let mockDate: Date;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockDate = new Date('2023-01-01T00:00:00Z');
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('static create', () => {
    it('should create a UTCDate instance with the current date', () => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(sut).toBeInstanceOf(UTCDate);
      expect(sut.value).toBeInstanceOf(Date);
      expect(sut.value).toEqual(mockDate);
    });

    it('should throw an error when provided an invalid date', () => {
      // Act & Assert
      expect(() => UTCDate.from('invalid-date' as any)).toThrow(InvalidDateError);
    });
  });

  describe('static from', () => {
    it.each(
      [
        '2022-03-15T12:30:45Z',
        '2021-07-20T08:15:00+00:00',
        '2020-11-05T23:59:59-00:00',
        '2019-02-28T14:00:00.000Z',
        '2018-06-10T10:45:30Z',
        '2017-09-25T16:20:00+00:00',
        '2016-12-31T23:00:00-00:00',
        '2015-04-01T05:30:15.000Z',
        '2014-08-18',
      ]
    )('should create a UTCDate instance from a Date object', (dateString) => {
      // Act
      const date = new Date(dateString);
      const sut = UTCDate.from(date);
      // Assert
      expect(sut).toBeInstanceOf(UTCDate);
      expect(sut.value).toEqual(date);
      expect(sut.value.getTime()).toEqual(date.getTime());
      expect(sut.value.getDay()).toEqual(date.getDay());
      expect(sut.value.getMonth()).toEqual(date.getMonth());
      expect(sut.value.getFullYear()).toEqual(date.getFullYear());
    });
  });

  describe('get value', () => {
    it('should return the date as a Date object', () => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(sut.value).toBeInstanceOf(Date);
      expect(sut.value).toEqual(mockDate);
    });
  });

  describe('get isoString', () => {
    it('should return the date as an ISO string', () => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(sut.isoString).toEqual(mockDate.toISOString().split('T')[0]);
    });
  });

  describe('addDays', () => {
    it.each([
      { days: 1, expectedDate: '2023-01-02T00:00:00Z' },
      { days: 5, expectedDate: '2023-01-06T00:00:00Z' },
      { days: 30, expectedDate: '2023-01-31T00:00:00Z' },
      { days: 45, expectedDate: '2023-02-15T00:00:00Z' },
    ])('should add days to the current date', (data: any) => {
      // Arrange
      const sut = UTCDate.create();
      const newDate = sut.addDays(data.days);
      // Act & Assert
      expect(newDate).toBeInstanceOf(UTCDate);
      expect(newDate.value).toEqual(new Date(data.expectedDate));
    });

    it.each([
      -5,
      0,
      NaN,
      'abc',
      undefined,
      null,
      1.5,
      '2.5',
    ])('should throw an error when adding invalid days', (days: any) => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(() => sut.addDays(days)).toThrow('Quantidade de dias inválida');
      expect(() => sut.addDays(days)).toThrow(InvalidDaysQuantityError);
    });

    it('should not mutate the original date when adding days', () => {
      // Arrange
      const original = UTCDate.create();
      const added = original.addDays(3);
      // Act & Assert
      expect(original.value).toEqual(mockDate);
      expect(added.value).not.toEqual(mockDate);
    });
  });

  describe('addMonths', () => {
    it.each([
      { days: 1, expectedDate: '2023-02-01T00:00:00Z' },
      { days: 5, expectedDate: '2023-06-01T00:00:00Z' },
      { days: 12, expectedDate: '2024-01-01T00:00:00Z' },
      { days: 37, expectedDate: '2026-02-01T00:00:00Z' },
    ])('should add days to the current date', (data: any) => {
      // Arrange
      const sut = UTCDate.create();
      const newDate = sut.addMonths(data.days);
      // Act & Assert
      expect(newDate).toBeInstanceOf(UTCDate);
      expect(newDate.value).toEqual(new Date(data.expectedDate));
    });

    it.each([
      -5,
      0,
      2.5,
      NaN,
      'abc',
      undefined,
      null,
    ])('should throw an error when adding invalid months', (months: any) => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(() => sut.addMonths(months)).toThrow('Quantidade de meses inválida');
      expect(() => sut.addMonths(months)).toThrow(InvalidMonthsQuantityError);
    });

    it('should not mutate the original date when adding months', () => {
      // Arrange
      const original = UTCDate.create();
      const added = original.addMonths(3);
      // Act & Assert
      expect(original.value).toEqual(mockDate);
      expect(added.value).not.toEqual(mockDate);
    });
  });

  describe('isBefore', () => {
    it('should throw an error if the date is invalid', () => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(() => sut.isBefore(null as any)).toThrow('Data inválida');
      expect(() => sut.isBefore(null as any)).toThrow(InvalidDateError);
    });

    it('should throw an error if the date is not a UTCDate instance', () => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(() => sut.isBefore(new Date() as any)).toThrow('Data inválida');
      expect(() => sut.isBefore(new Date() as any)).toThrow(InvalidDateError);
    });

    it('should return true if the date is before the given date', () => {
      // Arrange
      const sut = UTCDate.create();
      const futureDate = UTCDate.from(sut.addDays(1).value);
      // Act & Assert
      expect(sut.isBefore(futureDate)).toBe(true);
    });

    it('should return false if the date is after the given date', () => {
      // Arrange
      const sut = UTCDate.create();
      const pastDate = UTCDate.from(new Date('2022-12-31T00:00:00Z'));
      // Act & Assert
      expect(sut.isBefore(pastDate)).toBe(false);
    });

    it('should return true if the date is equal to the given date and inclusive is true', () => {
      // Arrange
      const sut = UTCDate.create();
      const sameDate = UTCDate.from(mockDate);
      // Act & Assert
      expect(sut.isBefore(sameDate, true)).toBe(true);
    });

    it('should return false if the date is equal to the given date and inclusive is false', () => {
      // Arrange
      const sut = UTCDate.create();
      const sameDate = UTCDate.from(mockDate);
      // Act & Assert
      expect(sut.isBefore(sameDate)).toBe(false);
    });
  });

  describe('isAfter', () => {
    it('should throw an error if the date is invalid', () => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(() => sut.isAfter(null as any)).toThrow('Data inválida');
      expect(() => sut.isAfter(null as any)).toThrow(InvalidDateError);
    });

    it('should throw an error if the date is not a UTCDate instance', () => {
      // Arrange
      const sut = UTCDate.create();
      // Act & Assert
      expect(() => sut.isAfter(new Date() as any)).toThrow('Data inválida');
      expect(() => sut.isAfter(new Date() as any)).toThrow(InvalidDateError);
    });

    it('should return true if the date is after the given date', () => {
      // Arrange
      const sut = UTCDate.create();
      const pastDate = UTCDate.from(new Date('2022-12-31T00:00:00Z'));
      // Act & Assert
      expect(sut.isAfter(pastDate)).toBe(true);
    });

    it('should return false if the date is before the given date', () => {
      // Arrange
      const sut = UTCDate.create();
      const futureDate = UTCDate.from(sut.addDays(1).value);
      // Act & Assert
      expect(sut.isAfter(futureDate)).toBe(false);
    });

    it('should return true if the date is equal to the given date and inclusive is true', () => {
      // Arrange
      const sut = UTCDate.create();
      const sameDate = UTCDate.from(mockDate);
      // Act & Assert
      expect(sut.isAfter(sameDate, true)).toBe(true);
    });

    it('should return false if the date is equal to the given date and inclusive is false', () => {
      // Arrange
      const sut = UTCDate.create();
      const sameDate = UTCDate.from(mockDate);
      // Act & Assert
      expect(sut.isAfter(sameDate)).toBe(false);
    });
  });
});
