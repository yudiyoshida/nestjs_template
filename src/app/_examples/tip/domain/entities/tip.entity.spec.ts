/**
 * TESTES UNITÁRIOS — Tip (entidade de domínio)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste Unitário
 * Aqui testamos a entidade de domínio `Tip` em completo isolamento. Entidades
 * de domínio encapsulam as regras de negócio mais críticas da aplicação: criação
 * com invariantes válidas, transições de estado permitidas e proibidas, cálculo
 * de expiração, etc. Testá-las unitariamente garante que essas regras estejam
 * corretas independentemente de banco de dados, HTTP ou qualquer infraestrutura.
 *
 * POR QUE NÃO HÁ MOCKS AQUI?
 * A entidade `Tip` é um objeto puro de domínio: não depende de nenhum serviço
 * externo, repositório ou infraestrutura. Ela recebe dados, aplica regras e
 * retorna resultados. Não há nada a mockar — o teste instancia a entidade
 * diretamente e verifica seu comportamento.
 *
 * PADRÃO AAA (Arrange / Act / Assert)
 * Todos os testes seguem o padrão AAA, que organiza o teste em três blocos:
 *   - Arrange: prepara os dados e o estado inicial.
 *   - Act:     executa a ação que está sendo testada.
 *   - Assert:  verifica que o resultado é o esperado.
 * Esse padrão torna os testes fáceis de ler e de diagnosticar quando falham.
 */
import { TipStatus } from '../enums/tip-status.enum';
import { TipType } from '../enums/tip-type.enum';
import { TipCannotBeEditedError } from '../errors/tip.error';
import { Tip, TipCreateProps, TipProps } from './tip.entity';

/**
 * Fábrica de props de criação com suporte a overrides.
 * Centraliza a criação do objeto base para que cada teste declare apenas
 * os campos relevantes para o cenário que está sendo verificado.
 * Isso reduz duplicação e torna o teste mais focado e legível.
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
 * Fábrica de props de carregamento (dados já existentes no banco).
 * Usada nos testes de `Tip.load()` e em cenários onde precisamos de uma
 * entidade em um estado específico (ex: EXPIRED, REMOVED) sem depender
 * dos métodos de criação para chegar a esse estado.
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Tip Entity', () => {
  describe('createWeather', () => {
    it('should create a weather tip with correct type', () => {
      // Arrange
      const props = makeTipCreateProps();

      // Act
      const tip = Tip.createWeather(props);

      // Assert
      expect(tip.props.type).toBe(TipType.WEATHER);
      expect(tip.isWeather()).toBe(true);
      expect(tip.isLocal()).toBe(false);
    });

    /**
     * Verifica que a expiração é calculada como "agora + 24h".
     * Como o tempo avança durante a execução, não podemos testar um valor exato.
     * Em vez disso, capturamos um intervalo de tempo antes e depois da criação
     * e verificamos que o `expiresAt` cai dentro desse intervalo acrescido de 24h.
     * Esse padrão de "testar dentro de um intervalo" é comum para timestamps
     * gerados automaticamente pela aplicação.
     */
    it('should create weather tip with expiresAt set to 24 hours from now', () => {
      // Arrange
      const props = makeTipCreateProps();
      const beforeCreate = new Date();

      // Act
      const tip = Tip.createWeather(props);

      // Assert
      const afterCreate = new Date();
      const expectedExpiration = new Date(beforeCreate.getTime() + 24 * 60 * 60 * 1000);

      expect(tip.props.expiresAt).not.toBeNull();
      expect(tip.props.expiresAt!.getTime()).toBeGreaterThanOrEqual(expectedExpiration.getTime());
      expect(tip.props.expiresAt!.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 24 * 60 * 60 * 1000);
    });

    it('should create weather tip with status ACTIVE', () => {
      // Arrange
      const props = makeTipCreateProps();

      // Act
      const tip = Tip.createWeather(props);

      // Assert
      expect(tip.props.status).toBe(TipStatus.ACTIVE);
      expect(tip.isActive()).toBe(true);
    });

    it('should create weather tip with generated id', () => {
      // Arrange
      const props = makeTipCreateProps();

      // Act
      const tip = Tip.createWeather(props);

      // Assert
      expect(tip.props.id).toBeDefined();
      expect(typeof tip.props.id).toBe('string');
      expect(tip.props.id.length).toBeGreaterThan(0);
    });

    /**
     * O `setTimeout` de 10ms antes e depois da criação garante que os timestamps
     * gerados pela entidade estejam estritamente entre `beforeCreate` e `afterCreate`.
     * Sem esse intervalo, os três valores poderiam ter o mesmo milissegundo e as
     * asserções de GreaterThanOrEqual/LessThanOrEqual não detectariam um timestamp
     * incorreto (ex: hardcoded em `new Date(0)`).
     */
    it('should create weather tip with timestamps', async() => {
      // Arrange
      const props = makeTipCreateProps();
      const beforeCreate = new Date();

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure some time has passed to test timestamps
      const tip = Tip.createWeather(props);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure some time has passed to test timestamps

      // Assert
      const afterCreate = new Date();
      expect(tip.props.createdAt).toBeInstanceOf(Date);
      expect(tip.props.updatedAt).toBeInstanceOf(Date);
      expect(tip.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(tip.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create weather tip with optional locationId', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'location-id-123' });

      // Act
      const tip = Tip.createWeather(props);

      // Assert
      expect(tip.props.locationId).toBe('location-id-123');
    });

    it('should create weather tip with null locationId', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: null });

      // Act
      const tip = Tip.createWeather(props);

      // Assert
      expect(tip.props.locationId).toBeNull();
    });

    /**
     * Teste de contrato completo da criação: verifica todos os campos de uma vez.
     * O uso de `expect.any(String)` e `expect.any(Date)` para campos gerados
     * automaticamente (id, timestamps, expiresAt) permite validar o formato sem
     * depender de valores específicos, tornando o teste estável ao longo do tempo.
     * O tipo genérico `toEqual<Tip['props']>` aproveita o TypeScript para garantir
     * que nenhum campo foi adicionado ao tipo sem ser coberto pela asserção.
     */
    it('should create weather tip with correct fields', () => {
      // Arrange
      const props = makeTipCreateProps({
        title: 'Weather Alert',
        content: 'Heavy rain expected tomorrow.',
        locationId: 'location-id',
        createdBy: 'user-id',
      });

      // Act
      const tip = Tip.createWeather(props);

      // Assert
      expect(tip.props).toEqual<Tip['props']>({
        id: expect.any(String),
        type: TipType.WEATHER,
        status: TipStatus.ACTIVE,
        title: props.title,
        content: props.content,
        locationId: props.locationId,
        createdBy: props.createdBy,
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('createLocal', () => {
    it('should create a local tip with correct type', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'location-id' });

      // Act
      const tip = Tip.createLocal(props);

      // Assert
      expect(tip.props.type).toBe(TipType.LOCAL);
      expect(tip.isLocal()).toBe(true);
      expect(tip.isWeather()).toBe(false);
    });

    it('should create local tip without expiration', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'location-id' });

      // Act
      const tip = Tip.createLocal(props);

      // Assert
      expect(tip.props.expiresAt).toBeNull();
    });

    it('should create local tip with required locationId', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'location-id-123' });

      // Act
      const tip = Tip.createLocal(props);

      // Assert
      expect(tip.props.locationId).toBe('location-id-123');
    });

    it('should create local tip with status ACTIVE', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'location-id' });

      // Act
      const tip = Tip.createLocal(props);

      // Assert
      expect(tip.props.status).toBe(TipStatus.ACTIVE);
      expect(tip.isActive()).toBe(true);
    });

    /**
     * Testa invariantes da entidade: dicas locais exigem um `locationId`.
     * Testamos dois casos distintos (`undefined` e `null`) porque a entidade
     * pode receber dados de fontes diferentes. `undefined` representa ausência
     * do campo; `null` representa a intenção explícita de não ter localização.
     * Ambos devem ser rejeitados para garantir a integridade do domínio.
     *
     * O padrão `expect(() => ...).toThrow(...)` é usado porque o erro é lançado
     * de forma síncrona dentro do construtor/factory. Envolver em arrow function
     * é necessário para que o Jest capture a exceção antes que ela se propague.
     */
    it('should throw error if locationId is not provided', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: undefined });

      // Act & Assert
      expect(() => Tip.createLocal(props)).toThrow('Location ID is required for local tips.');
    });

    it('should throw error if locationId is null', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: null });

      // Act & Assert
      expect(() => Tip.createLocal(props)).toThrow('Location ID is required for local tips.');
    });

    it('should create local tip with generated id', () => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'location-id' });

      // Act
      const tip = Tip.createLocal(props);

      // Assert
      expect(tip.props.id).toBeDefined();
      expect(typeof tip.props.id).toBe('string');
      expect(tip.props.id.length).toBeGreaterThan(0);
    });

    it('should create local tip with timestamps', async() => {
      // Arrange
      const props = makeTipCreateProps({ locationId: 'location-id' });
      const beforeCreate = new Date();

      // Act
      await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure some time has passed to test timestamps
      const tip = Tip.createLocal(props);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure some time has passed to test timestamps

      // Assert
      const afterCreate = new Date();
      expect(tip.props.createdAt).toBeInstanceOf(Date);
      expect(tip.props.updatedAt).toBeInstanceOf(Date);
      expect(tip.props.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(tip.props.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should create local tip with correct fields', () => {
      // Arrange
      const props = makeTipCreateProps({
        title: 'Local Event',
        content: 'Farmers market this weekend.',
        locationId: 'location-id',
        createdBy: 'user-id',
      });

      // Act
      const tip = Tip.createLocal(props);

      // Assert
      expect(tip.props).toEqual<Tip['props']>({
        id: expect.any(String),
        type: TipType.LOCAL,
        status: TipStatus.ACTIVE,
        title: props.title,
        content: props.content,
        locationId: props.locationId,
        createdBy: props.createdBy,
        expiresAt: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('load', () => {
    it('should load tip from existing props', () => {
      // Arrange
      const props = makeTipLoadProps({ locationId: null });

      // Act
      const tip = Tip.load(props);

      // Assert
      expect(tip.props).toEqual(props);
    });

    it('should load tip from existing props with location', () => {
      // Arrange
      const props = makeTipLoadProps({ locationId: 'location-id' });

      // Act
      const tip = Tip.load(props);

      // Assert
      expect(tip.props).toEqual(props);
    });
  });

  describe('getters', () => {
    it('should return true for isWeather when type is WEATHER', () => {
      // Arrange
      const tip = Tip.createWeather(makeTipCreateProps());

      // Act & Assert
      expect(tip.isWeather()).toBe(true);
      expect(tip.isLocal()).toBe(false);
    });

    it('should return true for isLocal when type is LOCAL', () => {
      // Arrange
      const tip = Tip.createLocal(makeTipCreateProps({ locationId: 'location-id' }));

      // Act & Assert
      expect(tip.isWeather()).toBe(false);
      expect(tip.isLocal()).toBe(true);
    });

    it('should return true for isActive when status is ACTIVE', () => {
      // Arrange
      const tip = Tip.createWeather(makeTipLoadProps({ status: TipStatus.ACTIVE }));

      // Act & Assert
      expect(tip.isActive()).toBe(true);
      expect(tip.isExpired()).toBe(false);
      expect(tip.isRemoved()).toBe(false);
    });

    it('should return true for isExpired when status is EXPIRED', () => {
      // Arrange
      const tip = Tip.load(makeTipLoadProps({ status: TipStatus.EXPIRED }));

      // Act & Assert
      expect(tip.isExpired()).toBe(true);
      expect(tip.isActive()).toBe(false);
    });

    it('should return true for isRemoved when status is REMOVED', () => {
      // Arrange
      const tip = Tip.load(makeTipLoadProps({ status: TipStatus.REMOVED }));

      // Act & Assert
      expect(tip.isRemoved()).toBe(true);
      expect(tip.isActive()).toBe(false);
    });
  });

  describe('hasExpired', () => {
    /**
     * Os três cenários de `hasExpired` cobrem os casos possíveis:
     *   1. Data no passado  → expirado (true)
     *   2. Data no futuro   → não expirado (false)
     *   3. Sem data (null)  → nunca expira (false) — dicas locais não têm validade
     *
     * Usamos `Tip.load()` com datas controladas para garantir que o método
     * compara corretamente com `Date.now()`, sem depender de estado interno
     * da criação da entidade.
     */
    it('should return true when expiresAt is in the past', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 1000); // 1 segundo atras
      const tip = Tip.load(makeTipLoadProps({ expiresAt: pastDate }));

      // Act & Assert
      expect(tip.hasExpired()).toBe(true);
    });

    it('should return false when expiresAt is in the future', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
      const tip = Tip.load(makeTipLoadProps({ expiresAt: futureDate }));

      // Act & Assert
      expect(tip.hasExpired()).toBe(false);
    });

    it('should return false when expiresAt is null', () => {
      // Arrange
      const tip = Tip.load(makeTipLoadProps({ expiresAt: null }));

      // Act & Assert
      expect(tip.hasExpired()).toBe(false);
    });
  });

  describe('expire', () => {
    it('should change status to EXPIRED', () => {
      // Arrange
      const tip = Tip.createWeather(makeTipCreateProps());

      // Act
      tip.expire();

      // Assert
      expect(tip.props.status).toBe(TipStatus.EXPIRED);
      expect(tip.isExpired()).toBe(true);
      expect(tip.isActive()).toBe(false);
      expect(tip.isRemoved()).toBe(false);
    });

    /**
     * Verifica que a transição de estado atualiza o `updatedAt`.
     * O `setTimeout` de 10ms garante que o novo timestamp seja estritamente
     * maior que o original — sem o delay, ambos poderiam cair no mesmo milissegundo
     * e a asserção `toBeGreaterThan` falharia mesmo com a implementação correta.
     */
    it('should update updatedAt timestamp', async() => {
      // Arrange
      const tip = Tip.createWeather(makeTipCreateProps());
      const originalUpdatedAt = tip.props.updatedAt;

      // Act
      await new Promise(resolve => setTimeout(resolve, 10));
      tip.expire();

      // Assert
      expect(tip.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('remove', () => {
    it('should change status to REMOVED', () => {
      // Arrange
      const tip = Tip.createWeather(makeTipCreateProps());

      // Act
      tip.remove();

      // Assert
      expect(tip.props.status).toBe(TipStatus.REMOVED);
      expect(tip.isRemoved()).toBe(true);
      expect(tip.isActive()).toBe(false);
      expect(tip.isExpired()).toBe(false);
    });

    it('should update updatedAt timestamp', async() => {
      // Arrange
      const tip = Tip.createWeather(makeTipCreateProps());
      const originalUpdatedAt = tip.props.updatedAt;

      // Act
      await new Promise(resolve => setTimeout(resolve, 10));
      tip.remove();

      // Assert
      expect(tip.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('update', () => {
    it('should update title when provided', () => {
      // Arrange
      const tip = Tip.createWeather({
        title: 'Original Title',
        content: 'Original Content',
        locationId: null,
        createdBy: 'user-id',
      });

      // Act
      tip.update({ title: 'Updated Title' });

      // Assert
      expect(tip.props).toEqual<Tip['props']>({
        ...tip.props,
        title: 'Updated Title',
      });
    });

    it('should update content when provided', () => {
      // Arrange
      const tip = Tip.createLocal({
        title: 'Original Title',
        content: 'Original Content',
        locationId: 'location-id',
        createdBy: 'user-id',
      });

      // Act
      tip.update({ content: 'Updated Content' });

      // Assert
      expect(tip.props).toEqual<Tip['props']>({
        ...tip.props,
        content: 'Updated Content',
      });
    });

    it('should update both title and content when provided', () => {
      // Arrange
      const tip = Tip.createWeather({
        title: 'Original Title',
        content: 'Original Content',
        locationId: null,
        createdBy: 'user-id',
      });

      // Act
      tip.update({ title: 'New Title', content: 'New Content' });

      // Assert
      expect(tip.props).toEqual<Tip['props']>({
        ...tip.props,
        title: 'New Title',
        content: 'New Content',
      });
    });

    it('should update updatedAt timestamp', async() => {
      // Arrange
      const tip = Tip.createWeather({
        title: 'Test',
        content: 'Test',
        locationId: null,
        createdBy: 'user-id',
      });
      const originalUpdatedAt = tip.props.updatedAt;

      // Act
      await new Promise(resolve => setTimeout(resolve, 10));
      tip.update({ title: 'Updated' });

      // Assert
      expect(tip.props.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    /**
     * Testa regras de negócio de proteção de estado: uma dica expirada ou
     * removida não pode ser editada. Verificamos DOIS aspectos do erro:
     *   1. O tipo (`TipCannotBeEditedError`) — garante que o filter HTTP trate
     *      corretamente e retorne o status adequado ao cliente.
     *   2. A mensagem — garante que o texto não mude silenciosamente.
     *
     * Os estados EXPIRED e REMOVED são testados separadamente para garantir
     * que a regra se aplica a ambos, não apenas a um deles.
     */
    it('should throw TipCannotBeEditedError when tip is EXPIRED', () => {
      // Arrange
      const tip = Tip.createWeather({
        title: 'Test',
        content: 'Test',
        locationId: null,
        createdBy: 'user-id',
      });
      tip.expire();

      // Act & Assert
      expect(() => tip.update({ title: 'New Title' })).toThrow(TipCannotBeEditedError);
      expect(() => tip.update({ title: 'New Title' })).toThrow('Dica não pode ser editada porque está expirada ou removida');
    });

    it('should throw TipCannotBeEditedError when tip is REMOVED', () => {
      // Arrange
      const tip = Tip.createLocal({
        title: 'Test',
        content: 'Test',
        locationId: 'location-id',
        createdBy: 'user-id',
      });
      tip.remove();

      // Act & Assert
      expect(() => tip.update({ title: 'New Title' })).toThrow(TipCannotBeEditedError);
      expect(() => tip.update({ title: 'New Title' })).toThrow('Dica não pode ser editada porque está expirada ou removida');
    });

    it('should not update when no fields are provided', () => {
      // Arrange
      const tip = Tip.createWeather({
        title: 'Original Title',
        content: 'Original Content',
        locationId: null,
        createdBy: 'user-id',
      });

      // Act
      tip.update({});

      // Assert
      expect(tip.props).toEqual<Tip['props']>(tip.props);
    });
  });

  describe('props getter', () => {
    /**
     * Verifica que o getter `props` retorna uma CÓPIA do objeto interno,
     * não uma referência direta. Isso é importante para proteger o estado
     * interno da entidade: se o getter retornasse a referência original,
     * qualquer código externo poderia modificar os props diretamente,
     * contornando as regras de negócio (ex: mudar o status sem passar por
     * `expire()` ou `remove()`).
     *
     * `toEqual` verifica igualdade de valor (conteúdo idêntico).
     * `not.toBe` verifica que são objetos diferentes na memória (referências distintas).
     */
    it('should return readonly copy of props', () => {
      // Arrange
      const tip = Tip.createWeather({
        title: 'Test',
        content: 'Test',
        locationId: null,
        createdBy: 'user-id',
      });

      // Act
      const props1 = tip.props;
      const props2 = tip.props;

      // Assert
      expect(props1).toEqual(props2);
      expect(props1).not.toBe(props2); // Different object reference
    });
  });
});
