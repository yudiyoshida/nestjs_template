import type { SendForgotPasswordEmailInput } from '../../dtos/smtp.dto';
import { SmtpFakeAdapterGateway } from './smtp-fake.gateway';

describe('SmtpFakeAdapterGateway - Unit tests', () => {
  let sut: SmtpFakeAdapterGateway;

  beforeEach(() => {
    sut = new SmtpFakeAdapterGateway();
  });

  describe('sendForgotPasswordEmail', () => {
    describe('Happy path', () => {
      it('should store the input in sentForgotPasswordEmails', async() => {
        // Arrange
        const input: SendForgotPasswordEmailInput = {
          to: 'account@mail.com',
          code: '123456',
        };

        // Act
        await sut.sendForgotPasswordEmail(input);

        // Assert
        expect(sut.sentForgotPasswordEmails).toEqual([input]);
      });

      it('should resolve undefined', async() => {
        // Arrange
        const input: SendForgotPasswordEmailInput = {
          to: 'account@mail.com',
          code: '123456',
        };

        // Act & Assert
        await expect(sut.sendForgotPasswordEmail(input)).resolves.toBeUndefined();
      });

      it('should keep every input in call order when called more than once', async() => {
        // Arrange
        const firstInput: SendForgotPasswordEmailInput = {
          to: 'first@mail.com',
          code: '111111',
        };
        const secondInput: SendForgotPasswordEmailInput = {
          to: 'second@mail.com',
          code: '222222',
        };

        // Act
        await sut.sendForgotPasswordEmail(firstInput);
        await sut.sendForgotPasswordEmail(secondInput);

        // Assert
        expect(sut.sentForgotPasswordEmails).toEqual([firstInput, secondInput]);
      });
    });

    describe('Edge cases', () => {
      it('should start with an empty sentForgotPasswordEmails list', () => {
        // Act & Assert
        expect(sut.sentForgotPasswordEmails).toEqual([]);
      });

      it('should not share state between instances', async() => {
        // Arrange
        const input: SendForgotPasswordEmailInput = {
          to: 'account@mail.com',
          code: '123456',
        };
        await sut.sendForgotPasswordEmail(input);

        // Act
        const other = new SmtpFakeAdapterGateway();

        // Assert
        expect(other.sentForgotPasswordEmails).toEqual([]);
      });
    });
  });
});
