/**
 * TESTES UNITÁRIOS — TipFactory
 *
 * TIPO: Teste Unitário
 * Testamos a fábrica de domínio `TipFactory` em isolamento. A fábrica é
 * responsável por centralizar a lógica de criação de entidades `Tip`,
 * garantindo invariantes como validação de campos obrigatórios, atribuição
 * de tipo, status inicial e cálculo de datas.
 *
 * POR QUE NÃO HÁ MOCKS AQUI?
 * A `TipFactory` depende apenas de Value Objects puros (`UUID`, `UTCDate`) e
 * da entidade `Tip`, todos objetos sem efeitos colaterais externos. Não há
 * nada a mockar — instanciamos a fábrica diretamente e verificamos o resultado.
 *
 * PADRÃO AAA (Arrange / Act / Assert)
 * Todos os testes seguem o padrão AAA:
 *   - Arrange: prepara os dados de entrada.
 *   - Act:     executa o método da fábrica.
 *   - Assert:  verifica que o resultado é o esperado.
 */
import { AppException } from 'src/core/filters/app.exception';
import { TipCreateProps, TipProps } from '../entities/tip.entity';
import { TipStatus } from '../enums/tip-status.enum';
import { TipType } from '../enums/tip-type.enum';
import { TipFactory } from './tip.factory';

/**
 * Fábrica de props de criação com suporte a overrides.
 * Centraliza a criação do objeto base para que cada teste declare apenas
 * os campos relevantes para o cenário que está sendo verificado.
 */
function makeTipCreateProps(overrides?: Partial<TipCreateProps>): TipCreateProps {
  return {
    title: 'Test Tip',
    content: 'This is a test tip.',
    locationId: null,
    createdBy: 'user-id',
    ...overrides,
  };
}

/**
 * Fábrica de props de carregamento (dados já persistidos).
 * Usada nos testes de `TipFactory.load()`.
 */
function makeTipLoadProps(overrides?: Partial<TipProps>): TipProps {
  return {
    id: 'tip-id',
    type: TipType.WEATHER,
    status: TipStatus.ACTIVE,
    title: 'Test Tip',
    content: 'This is a test tip.',
    locationId: null,
    createdBy: 'user-id',
    expiresAt: new Date(),
    ...overrides,
  };
}

describe('TipFactory', () => {
  // ---------------------------------------------------------------------------
  // createWeather
  // ---------------------------------------------------------------------------
  describe('createWeather', () => {
    it('should create a tip with type WEATHER', () => {
      // Arrange
      const props = makeTipCreateProps();

      // Act
      const tip = TipFactory.createWeather(props);

      // Assert
      expect(tip.props.type).toBe(TipType.WEATHER);
      expect(tip.isWeather()).toBe(true);
      expect(tip.isLocal()).toBe(false);
    });

    it('should create a weather tip with status ACTIVE', () => {
      // Arrange
      const props = makeTipCreateProps();

      // Act
      const tip = TipFactory.createWeather(props);

      // Assert
      expect(tip.props.status).toBe(TipStatus.ACTIVE);
      expect(tip.isActive()).toBe(true);
      expect(tip.isExpired()).toBe(false);
      expect(tip.isRemoved()).toBe(false);
    });

    it('should create a weather tip with a generated UUID as id', () => {
      // Arrange
      const props = makeTipCreateProps();

      // Act
      const tip = TipFactory.createWeather(props);

      // Assert
      expect(tip.props.id).toBeDefined();
      expect(typeof tip.props.id).toBe('string');
      expect(tip.props.id.length).toBeGreaterThan(0);
    });

    it('should create two weather tips with different ids', () => {
      // Arrange
      const props = makeTipCreateProps();

      // Act
      const tip1 = TipFactory.createWeather(props);
      const tip2 = TipFactory.createWeather(props);

      // Assert
      expect(tip1.props.id).not.toBe(tip2.props.id);
    });

    /**
     * Verifica que `expiresAt` é calculado como "agora + 24h".
     * Usamos um intervalo de tempo em torno da criação para evitar falhas
     * por diferença de milissegundos na execução do teste.
     */
    it('should set expiresAt to approximately 24 hours from now', () => {
      // Arrange
      const props = makeTipCreateProps();
      const beforeCreate = new Date();

      // Act
      const tip = TipFactory.createWeather(props);

      // Assert
      const afterCreate = new Date();
      const minExpiration = new Date(beforeCreate.getTime() + 24 * 60 * 60 * 1000);
      const maxExpiration = new Date(afterCreate.getTime() + 24 * 60 * 60 * 1000);

      expect(tip.props.expiresAt).not.toBeNull();
      expect(tip.props.expiresAt!.getTime()).toBeGreaterThanOrEqual(minExpiration.getTime());
      expect(tip.props.expiresAt!.getTime()).toBeLessThanOrEqual(maxExpiration.getTime());
    });

    it('should preserve title, content, locationId and createdBy from input props', () => {
      // Arrange
      const props = makeTipCreateProps({
        title: 'Weather Alert',
        content: 'Heavy rain expected.',
        locationId: 'loc-id',
        createdBy: 'admin-id',
      });

      // Act
      const tip = TipFactory.createWeather(props);

      // Assert
      expect(tip.props.title).toBe('Weather Alert');
      expect(tip.props.content).toBe('Heavy rain expected.');
      expect(tip.props.locationId).toBe('loc-id');
      expect(tip.props.createdBy).toBe('admin-id');
    });

    describe('validation — title', () => {
      it('should throw AppException when title is an empty string', () => {
        // Arrange
        const props = makeTipCreateProps({ title: '' });

        // Act & Assert
        expect(() => TipFactory.createWeather(props)).toThrow(AppException);
      });

      it('should throw AppException when title is a whitespace-only string', () => {
        // Arrange
        const props = makeTipCreateProps({ title: '   ' });

        // Act & Assert
        expect(() => TipFactory.createWeather(props)).toThrow(AppException);
      });

      it('should throw AppException when title is not a string', () => {
        // Arrange
        const props = makeTipCreateProps({ title: 123 as unknown as string });

        // Act & Assert
        expect(() => TipFactory.createWeather(props)).toThrow(AppException);
      });
    });

    describe('validation — content', () => {
      it('should throw AppException when content is an empty string', () => {
        // Arrange
        const props = makeTipCreateProps({ content: '' });

        // Act & Assert
        expect(() => TipFactory.createWeather(props)).toThrow(AppException);
      });

      it('should throw AppException when content is a whitespace-only string', () => {
        // Arrange
        const props = makeTipCreateProps({ content: '   ' });

        // Act & Assert
        expect(() => TipFactory.createWeather(props)).toThrow(AppException);
      });

      it('should throw AppException when content is not a string', () => {
        // Arrange
        const props = makeTipCreateProps({ content: null as unknown as string });

        // Act & Assert
        expect(() => TipFactory.createWeather(props)).toThrow(AppException);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createLocal
  // ---------------------------------------------------------------------------
  describe('createLocal', () => {
    it('should create a tip with type LOCAL', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'loc-id' });

      // Act
      const tip = TipFactory.createLocal(props);

      // Assert
      expect(tip.props.type).toBe(TipType.LOCAL);
      expect(tip.isLocal()).toBe(true);
      expect(tip.isWeather()).toBe(false);
    });

    it('should create a local tip with status ACTIVE', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'loc-id' });

      // Act
      const tip = TipFactory.createLocal(props);

      // Assert
      expect(tip.props.status).toBe(TipStatus.ACTIVE);
      expect(tip.isActive()).toBe(true);
      expect(tip.isExpired()).toBe(false);
      expect(tip.isRemoved()).toBe(false);
    });

    it('should create a local tip with expiresAt as null', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'loc-id' });

      // Act
      const tip = TipFactory.createLocal(props);

      // Assert
      expect(tip.props.expiresAt).toBeNull();
    });

    it('should create a local tip with a generated UUID as id', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'loc-id' });

      // Act
      const tip = TipFactory.createLocal(props);

      // Assert
      expect(tip.props.id).toBeDefined();
      expect(typeof tip.props.id).toBe('string');
      expect(tip.props.id.length).toBeGreaterThan(0);
    });

    it('should create two local tips with different ids', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'loc-id' });

      // Act
      const tip1 = TipFactory.createLocal(props);
      const tip2 = TipFactory.createLocal(props);

      // Assert
      expect(tip1.props.id).not.toBe(tip2.props.id);
    });

    it('should preserve title, content, locationId and createdBy from input props', () => {
      // Arrange
      const props = makeTipCreateProps({
        title: 'Local Tip',
        content: 'Visit this place.',
        locationId: 'loc-123',
        createdBy: 'editor-id',
      });

      // Act
      const tip = TipFactory.createLocal(props);

      // Assert
      expect(tip.props.title).toBe('Local Tip');
      expect(tip.props.content).toBe('Visit this place.');
      expect(tip.props.locationId).toBe('loc-123');
      expect(tip.props.createdBy).toBe('editor-id');
    });

    describe('validation — locationId', () => {
      it('should throw AppException when locationId is null', () => {
        // Arrange
        const props = makeTipCreateProps({ locationId: null });

        // Act & Assert
        expect(() => TipFactory.createLocal(props)).toThrow(AppException);
      });

      it('should throw AppException when locationId is undefined', () => {
        // Arrange
        const props = makeTipCreateProps({ locationId: undefined as unknown as null });

        // Act & Assert
        expect(() => TipFactory.createLocal(props)).toThrow(AppException);
      });
    });

    describe('validation — title', () => {
      it('should throw AppException when title is an empty string', () => {
        // Arrange
        const props = makeTipCreateProps({ title: '', locationId: 'loc-id' });

        // Act & Assert
        expect(() => TipFactory.createLocal(props)).toThrow(AppException);
      });

      it('should throw AppException when title is a whitespace-only string', () => {
        // Arrange
        const props = makeTipCreateProps({ title: '   ', locationId: 'loc-id' });

        // Act & Assert
        expect(() => TipFactory.createLocal(props)).toThrow(AppException);
      });
    });

    describe('validation — content', () => {
      it('should throw AppException when content is an empty string', () => {
        // Arrange
        const props = makeTipCreateProps({ content: '', locationId: 'loc-id' });

        // Act & Assert
        expect(() => TipFactory.createLocal(props)).toThrow(AppException);
      });

      it('should throw AppException when content is a whitespace-only string', () => {
        // Arrange
        const props = makeTipCreateProps({ content: '   ', locationId: 'loc-id' });

        // Act & Assert
        expect(() => TipFactory.createLocal(props)).toThrow(AppException);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // load
  // ---------------------------------------------------------------------------
  describe('load', () => {
    it('should return a Tip with the same props provided', () => {
      // Arrange
      const props = makeTipLoadProps({
        id: 'existing-id',
        type: TipType.LOCAL,
        status: TipStatus.EXPIRED,
        title: 'Loaded Tip',
        content: 'Content loaded from DB.',
        locationId: 'loc-456',
        createdBy: 'user-789',
        expiresAt: null,
      });

      // Act
      const tip = TipFactory.load(props);

      // Assert
      expect(tip.props.id).toBe('existing-id');
      expect(tip.props.type).toBe(TipType.LOCAL);
      expect(tip.props.status).toBe(TipStatus.EXPIRED);
      expect(tip.props.title).toBe('Loaded Tip');
      expect(tip.props.content).toBe('Content loaded from DB.');
      expect(tip.props.locationId).toBe('loc-456');
      expect(tip.props.createdBy).toBe('user-789');
      expect(tip.props.expiresAt).toBeNull();
    });

    it('should load a tip with WEATHER type correctly', () => {
      // Arrange
      const expiresAt = new Date();
      const props = makeTipLoadProps({ type: TipType.WEATHER, expiresAt });

      // Act
      const tip = TipFactory.load(props);

      // Assert
      expect(tip.isWeather()).toBe(true);
      expect(tip.props.expiresAt).toBe(expiresAt);
    });

    it('should load a tip with REMOVED status correctly', () => {
      // Arrange
      const props = makeTipLoadProps({ status: TipStatus.REMOVED });

      // Act
      const tip = TipFactory.load(props);

      // Assert
      expect(tip.isRemoved()).toBe(true);
    });

    it('should load a tip with EXPIRED status correctly', () => {
      // Arrange
      const props = makeTipLoadProps({ status: TipStatus.EXPIRED });

      // Act
      const tip = TipFactory.load(props);

      // Assert
      expect(tip.isExpired()).toBe(true);
    });

    it('should not alter the provided props', () => {
      // Arrange
      const props = makeTipLoadProps();

      // Act
      const tip = TipFactory.load(props);

      // Assert - props returned must match what was given (no mutations)
      expect(tip.props.id).toBe(props.id);
      expect(tip.props.type).toBe(props.type);
      expect(tip.props.status).toBe(props.status);
      expect(tip.props.title).toBe(props.title);
      expect(tip.props.content).toBe(props.content);
    });
  });
});
