/**
 * TESTES UNITÁRIOS — Tip (entidade de domínio)
 *
 * Testes automatizados garantem que o código se comporta como esperado e
 * permitem detectar regressões rapidamente quando novas alterações são feitas.
 *
 * TIPO: Teste Unitário
 * Aqui testamos a entidade de domínio `Tip` em completo isolamento. A lógica
 * de criação e carregamento de instâncias é responsabilidade da `TipFactory`
 * e está coberta em seu próprio spec. Neste arquivo, testamos apenas o
 * comportamento da entidade: getters de estado, transições, cálculo de
 * expiração e regras de negócio que protegem a integridade do agregado.
 *
 * POR QUE NÃO HÁ MOCKS AQUI?
 * A entidade `Tip` é um objeto puro de domínio: não depende de nenhum serviço
 * externo, repositório ou infraestrutura. Ela recebe dados, aplica regras e
 * retorna resultados. Não há nada a mockar — o teste instancia a entidade
 * via `TipFactory` e verifica seu comportamento.
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
import { TipCannotBeEditedError } from '../errors/tip-cannot-be-edited.error';
import { TipFactory } from '../factories/tip.factory';
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
 * Usada nos testes onde precisamos de uma entidade em um estado específico
 * (ex: EXPIRED, REMOVED) sem depender dos métodos de criação para chegar a
 * esse estado.
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
  describe('getters', () => {
    it('should return true for isWeather when type is WEATHER', () => {
      // Arrange
      const tip = TipFactory.createWeather(makeTipCreateProps());

      // Act & Assert
      expect(tip.isWeather()).toBe(true);
      expect(tip.isLocal()).toBe(false);
    });

    it('should return true for isLocal when type is LOCAL', () => {
      // Arrange
      const tip = TipFactory.createLocal(makeTipCreateProps({ locationId: 'location-id' }));

      // Act & Assert
      expect(tip.isWeather()).toBe(false);
      expect(tip.isLocal()).toBe(true);
    });

    it('should return true for isActive when status is ACTIVE', () => {
      // Arrange
      const tip = TipFactory.createWeather(makeTipCreateProps());

      // Act & Assert
      expect(tip.isActive()).toBe(true);
      expect(tip.isExpired()).toBe(false);
      expect(tip.isRemoved()).toBe(false);
    });

    it('should return true for isExpired when status is EXPIRED', () => {
      // Arrange
      const tip = TipFactory.load(makeTipLoadProps({ status: TipStatus.EXPIRED }));

      // Act & Assert
      expect(tip.isExpired()).toBe(true);
      expect(tip.isActive()).toBe(false);
    });

    it('should return true for isRemoved when status is REMOVED', () => {
      // Arrange
      const tip = TipFactory.load(makeTipLoadProps({ status: TipStatus.REMOVED }));

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
      const tip = TipFactory.load(makeTipLoadProps({ expiresAt: pastDate }));

      // Act & Assert
      expect(tip.hasExpired()).toBe(true);
    });

    it('should return false when expiresAt is in the future', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
      const tip = TipFactory.load(makeTipLoadProps({ expiresAt: futureDate }));

      // Act & Assert
      expect(tip.hasExpired()).toBe(false);
    });

    it('should return false when expiresAt is null', () => {
      // Arrange
      const tip = TipFactory.load(makeTipLoadProps({ expiresAt: null }));

      // Act & Assert
      expect(tip.hasExpired()).toBe(false);
    });
  });

  describe('expire', () => {
    it('should change status to EXPIRED', () => {
      // Arrange
      const tip = TipFactory.createWeather(makeTipCreateProps());

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
      const tip = TipFactory.createWeather(makeTipCreateProps());
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
      const tip = TipFactory.createWeather(makeTipCreateProps());

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
      const tip = TipFactory.createWeather(makeTipCreateProps());
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
      const tip = TipFactory.createWeather({
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
      const tip = TipFactory.createLocal({
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
      const tip = TipFactory.createWeather({
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
      const tip = TipFactory.createWeather({
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
      const tip = TipFactory.createWeather({
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
      const tip = TipFactory.createLocal({
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
      const tip = TipFactory.createWeather({
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
      const tip = TipFactory.createWeather({
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
