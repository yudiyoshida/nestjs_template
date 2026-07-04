import { plainToInstance } from 'class-transformer';
import { StringToNumber } from './string-number';

describe('StringToNumber', () => {
  class TestClass {
    @StringToNumber()
    value: number;

    @StringToNumber({ groups: ['test'] })
    valueWithGroup: number;

    normalValue: any;
  }

  describe('string to number transformation', () => {
    it('should transform string numbers to actual numbers', () => {
      // Arrange
      const plain = { value: '123' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(123);
      expect(typeof instance.value).toBe('number');
    });

    it('should transform string float numbers to actual numbers', () => {
      // Arrange
      const plain = { value: '123.45' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(123.45);
      expect(typeof instance.value).toBe('number');
    });

    it('should transform negative string numbers to actual numbers', () => {
      // Arrange
      const plain = { value: '-456' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(-456);
      expect(typeof instance.value).toBe('number');
    });

    it('should transform string zero to number zero', () => {
      // Arrange
      const plain = { value: '0' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(0);
      expect(typeof instance.value).toBe('number');
    });

    it('should transform empty string to number zero', () => {
      // Arrange
      const plain = { value: '' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(0);
      expect(typeof instance.value).toBe('number');
    });

    it('should transform invalid string to NaN', () => {
      // Arrange
      const plain = { value: 'invalid' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBeNaN();
      expect(typeof instance.value).toBe('number');
    });
  });

  describe('non-string value handling', () => {
    it('should leave number values unchanged', () => {
      // Arrange
      const plain = { value: 789 };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(789);
      expect(typeof instance.value).toBe('number');
    });

    it('should leave boolean values unchanged', () => {
      // Arrange
      const plain = { value: true };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(true);
      expect(typeof instance.value).toBe('boolean');
    });

    it('should leave null values unchanged', () => {
      // Arrange
      const plain = { value: null };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(null);
    });

    it('should leave undefined values unchanged', () => {
      // Arrange
      const plain = { value: undefined };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBeUndefined();
    });

    it('should leave object values unchanged but create new reference', () => {
      // Arrange
      const obj = { nested: 'value' };
      const plain = { value: obj };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toStrictEqual(obj);
      expect(typeof instance.value).toBe('object');
    });

    it('should leave array values unchanged but create new reference', () => {
      // Arrange
      const arr = [1, 2, 3];
      const plain = { value: arr };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toStrictEqual(arr);
      expect(Array.isArray(instance.value)).toBe(true);
    });
  });

  describe('transformer options', () => {
    it('should respect group options when specified', () => {
      // Arrange
      const plain = { valueWithGroup: '999' };

      // Without the group, transformation should not occur
      const instanceWithoutGroup = plainToInstance(TestClass, plain);
      // Act & Assert
      expect(instanceWithoutGroup.valueWithGroup).toBe('999');
      expect(typeof instanceWithoutGroup.valueWithGroup).toBe('string');

      // With the group, transformation should occur
      const instanceWithGroup = plainToInstance(TestClass, plain, { groups: ['test'] });
      expect(instanceWithGroup.valueWithGroup).toBe(999);
      expect(typeof instanceWithGroup.valueWithGroup).toBe('number');
    });
  });

  describe('edge cases', () => {
    it('should handle scientific notation strings', () => {
      // Arrange
      const plain = { value: '1e3' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(1000);
      expect(typeof instance.value).toBe('number');
    });

    it('should handle hexadecimal strings', () => {
      // Arrange
      const plain = { value: '0xFF' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(255);
      expect(typeof instance.value).toBe('number');
    });

    it('should handle strings with leading/trailing whitespace', () => {
      // Arrange
      const plain = { value: '  123  ' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(123);
      expect(typeof instance.value).toBe('number');
    });

    it('should handle Infinity string', () => {
      // Arrange
      const plain = { value: 'Infinity' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(Infinity);
      expect(typeof instance.value).toBe('number');
    });

    it('should handle -Infinity string', () => {
      // Arrange
      const plain = { value: '-Infinity' };
      const instance = plainToInstance(TestClass, plain);

      // Act & Assert
      expect(instance.value).toBe(-Infinity);
      expect(typeof instance.value).toBe('number');
    });
  });

  describe('multiple properties', () => {
    class MultiplePropsClass {
      @StringToNumber()
      prop1: number;

      @StringToNumber()
      prop2: number;

      normalProp: any;
    }

    it('should transform multiple properties independently', () => {
      // Arrange
      const plain = {
        prop1: '100',
        prop2: '200',
        normalProp: 'unchanged',
      };
      const instance = plainToInstance(MultiplePropsClass, plain);

      // Act & Assert
      expect(instance.prop1).toBe(+plain.prop1);
      expect(instance.prop2).toBe(+plain.prop2);
      expect(instance.normalProp).toBe(plain.normalProp);
    });

    it('should handle mixed valid and invalid string numbers', () => {
      // Arrange
      const plain = {
        prop1: '100',
        prop2: 'invalid',
      };
      const instance = plainToInstance(MultiplePropsClass, plain);

      // Act & Assert
      expect(instance.prop1).toBe(100);
      expect(instance.prop2).toBeNaN();
    });
  });
});
