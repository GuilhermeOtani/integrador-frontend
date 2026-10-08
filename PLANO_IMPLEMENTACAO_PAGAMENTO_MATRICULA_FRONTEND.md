# Plano de implementação do pagamento de matrícula no frontend

## 1. Objetivo

Implementar, no Angular, a consulta e o pagamento das cobranças mensais do aluno. A experiência seguirá o fluxo já existente de pagamento de salário do motorista em **Contas a pagar**, adaptado para **Contas a receber** e para o usuário autenticado com papel `ALUNO`.

Este documento foi elaborado a partir de:

- análise do fluxo atual de `conta-pagar` e `pagamentos` no frontend;
- contratos descritos em `GUIA_PAGAMENTO_MATRICULA_FRONTEND.md`, recebido do backend;
- autenticação JWT, interceptor, guards, sidebar e tratamento de erros já existentes no projeto;
- padrão atual de componentes standalone, PrimeNG, `environment.apiUrl`, `MessageService` e signals.

O backend e o guia recebido não fazem parte das alterações deste plano.

## 2. Resultado esperado

Ao final da implementação:

1. O ADMIN continuará cadastrando e editando alunos, agora informando uma mensalidade válida.
2. O backend criará a primeira conta a receber com vencimento em 30 dias.
3. O aluno autenticado verá, em **Minhas matrículas**, somente as próprias cobranças.
4. Uma cobrança `PENDENTE` ou `ATRASADO` poderá ser paga escolhendo apenas a forma de pagamento.
5. O valor não será editável e não será enviado pelo frontend.
6. Após o pagamento, a tabela será atualizada e o recibo poderá ser consultado.
7. A criação das próximas cobranças mensais continuará sendo responsabilidade exclusiva da rotina agendada do backend.

## 3. Análise do fluxo atual de salário

O módulo existente está em `src/app/components/conta-pagar` e possui:

- `ContaPagarService`, que lista contas em `GET /contapagar/listar`;
- `PagamentoService`, que registra pagamentos em `POST /pagamentos/realizar/{contaId}`;
- consulta de recibo em `GET /pagamentos/recibo/conta/{contaId}`;
- separação visual entre contas pendentes e pagas;
- diálogo para confirmar a transação;
- seleção da forma de pagamento;
- atualização da lista após o pagamento;
- diálogo para visualizar o recibo.

Esse encadeamento será preservado:

```text
listar contas -> selecionar cobrança -> confirmar -> pagar -> recarregar -> exibir recibo
```

Entretanto, não será feita uma cópia literal da implementação atual. O fluxo de salário ainda utiliza `any`, `alert`, estado com propriedades mutáveis e permite informar `valorPago`. A matrícula utilizará contratos tipados, signals, notificações do PrimeNG, estados de carregamento e o utilitário `mensagemApi` já adotado nas telas novas.

### 3.1. Comparação entre os dois fluxos

| Aspecto | Salário do motorista | Matrícula do aluno |
|---|---|---|
| Natureza | Conta a pagar | Conta a receber |
| Usuário da tela | `ADMIN` | `ALUNO` |
| Lista | `GET /contapagar/listar` | `GET /contareceber/minhas` |
| Registro | `POST /pagamentos/realizar/{id}` | `POST /recebimentos/realizar/{id}` |
| Recibo | `/pagamentos/recibo/conta/{id}` | `/recebimentos/recibo/conta/{id}` |
| Identificação da pessoa | Conta informa o motorista | Backend identifica o aluno pelo JWT |
| Valor enviado pelo navegador | O fluxo atual aceita `valorPago` | Nunca será enviado; vem da cobrança |
| Recorrência | Backend gera salários | Backend gera nova matrícula/mensalidade |
| Acesso | Menu financeiro do ADMIN | Menu financeiro exclusivo do ALUNO |

## 4. Responsabilidade do frontend e do backend

### Frontend

- permitir que o ADMIN informe a mensalidade no cadastro do aluno;
- listar as contas retornadas por `/contareceber/minhas`;
- mostrar valor, vencimento e situação;
- solicitar apenas a forma de pagamento;
- enviar o identificador da cobrança na URL;
- atualizar os dados depois de pagar;
- consultar e mostrar o recibo;
- proteger rota e menu por papel;
- mostrar carregamento, lista vazia e erros compreensíveis.

### Backend

- identificar o aluno pelo JWT;
- impedir acesso à cobrança de outro aluno;
- obter o valor diretamente de `conta_receber`;
- criar a primeira cobrança;
- executar diariamente, às 02:00, a geração da próxima cobrança quando a anterior vencer;
- impedir cobranças mensais duplicadas;
- impedir pagamento duplicado;
- criar o `Recebimento` e alterar a conta para `PAGO`;
- alterar `statusMatricula` para `ATIV0` após o pagamento.

O frontend não terá temporizador para criar mensalidades e não calculará vencimentos. Quando uma nova cobrança for criada pelo backend, ela aparecerá na próxima atualização da lista.

## 5. Estrutura de arquivos proposta

Para seguir a organização existente de `conta-pagar`, o novo fluxo ficará agrupado por funcionalidade:

```text
src/app/components/conta-receber/
  model/
    conta-receber.ts
  conta-receber-service.ts
  conta-receber-service.spec.ts
  recebimento-service.ts
  recebimento-service.spec.ts
  minhas-matriculas/
    minhas-matriculas.ts
    minhas-matriculas.html
    minhas-matriculas.css
    minhas-matriculas.spec.ts
```

Também serão alterados:

```text
src/app/components/aluno/model/aluno.ts
src/app/components/aluno/aluno-cadastro/aluno-cadastro.ts
src/app/components/aluno/aluno-cadastro/aluno-cadastro.html
src/app/components/aluno/aluno-cadastro/aluno-cadastro.spec.ts
src/app/app.routes.ts
src/app/components/sidebar/sidebar.ts
src/app/components/sidebar/sidebar.spec.ts
DOCUMENTACAO_APLICACAO.md
```

## 6. Contratos TypeScript

Em `conta-receber/model/conta-receber.ts`:

```ts
export type StatusFinanceiro = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export type FormaPagamento =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO'
  | 'BOLETO'
  | 'TRANSFERENCIA';

export interface ContaReceber {
  id: number;
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: StatusFinanceiro;
  alunoId: number;
  nomeAluno: string;
}

export interface ReciboMatricula {
  id: number;
  contaId: number;
  valor: number;
  dataRecebimento: string;
  formaPagamento: FormaPagamento;
  nomeAluno: string;
  descricaoConta: string;
}
```

O campo de aluno existente também será ampliado:

```ts
mensalidade!: number | null;
```

Para criação ou edição, a tela validará um número maior que zero. O tipo aceita `null` na leitura porque alunos antigos podem ainda não possuir mensalidade cadastrada.

O enum de matrícula continuará usando os valores reais do backend: `ATIV0`, `INATIV0` e `PENDENTE`, com o algarismo zero. Nenhuma conversão será feita nas requisições.

## 7. Serviços HTTP

### 7.1. `ContaReceberService`

Será responsável apenas pela origem da dívida:

```ts
@Injectable({ providedIn: 'root' })
export class ContaReceberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/contareceber`;

  listarMinhas(): Observable<ContaReceber[]> {
    return this.http.get<ContaReceber[]>(`${this.apiUrl}/minhas`);
  }
}
```

### 7.2. `RecebimentoService`

Será responsável pelo registro e pelo recibo do recebimento:

```ts
@Injectable({ providedIn: 'root' })
export class RecebimentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recebimentos`;

  pagar(contaId: number, formaPagamento: FormaPagamento): Observable<ReciboMatricula> {
    const params = new HttpParams().set('formaPagamento', formaPagamento);
    return this.http.post<ReciboMatricula>(
      `${this.apiUrl}/realizar/${contaId}`,
      null,
      { params },
    );
  }

  buscarRecibo(contaId: number): Observable<ReciboMatricula> {
    return this.http.get<ReciboMatricula>(`${this.apiUrl}/recibo/conta/${contaId}`);
  }
}
```

Não serão incluídos nos métodos:

- `alunoId`;
- `pessoaId`;
- `nomeAluno`;
- valor digitado ou `valorPago`;
- status escolhido no navegador.

O interceptor atual adicionará `Authorization: Bearer <token>` às chamadas feitas para `environment.apiUrl`.

## 8. Ajuste no cadastro administrativo do aluno

O formulário atual de aluno é template-driven, com `FormsModule` e `[(ngModel)]`. Para manter o padrão dessa tela e reduzir risco de regressão, ele não será convertido inteiro para formulário reativo nesta entrega.

Será adicionado `InputNumberModule` e um campo PrimeNG:

```html
<p-inputNumber
  inputId="mensalidade"
  [(ngModel)]="aluno.mensalidade"
  mode="currency"
  currency="BRL"
  locale="pt-BR"
  [min]="0.01"
  [minFractionDigits]="2"
  [maxFractionDigits]="2"
  [fluid]="true"
/>
```

Antes de cadastrar ou atualizar, `confirmarSalvar()` validará:

- nome preenchido;
- matrícula preenchida;
- mensalidade numérica;
- mensalidade maior ou igual a `0,01`.

Se a mensalidade for inválida, a requisição não será enviada e a mensagem aparecerá junto ao campo. Erros retornados pelo backend serão exibidos por `MessageService` usando `mensagemApi`, em vez de ficarem apenas no console.

Ao editar um aluno antigo que tenha `mensalidade = null`, o ADMIN precisará informar um valor válido. Segundo o contrato do backend, o salvamento criará a primeira cobrança caso ainda não exista.

## 9. Tela “Minhas matrículas”

### 9.1. Estado do componente

O componente standalone usará signals, seguindo a tela `MinhasViagens`:

```ts
readonly contas = signal<ContaReceber[]>([]);
readonly carregando = signal(true);
readonly erro = signal<string | null>(null);
readonly pagando = signal(false);
readonly carregandoRecibo = signal(false);
readonly contaSelecionada = signal<ContaReceber | null>(null);
readonly recibo = signal<ReciboMatricula | null>(null);
formaPagamento: FormaPagamento = 'PIX';
```

Haverá uma única lista retornada pelo backend. A apresentação poderá separar por filtros **Em aberto** e **Histórico**, como em Contas a pagar, sem disparar novas requisições:

- em aberto: `PENDENTE` e `ATRASADO`;
- histórico: `PAGO`.

### 9.2. Colunas

A tabela mostrará:

- descrição;
- valor em `BRL`;
- data de vencimento em `dd/MM/yyyy`;
- status com `p-tag`;
- ações disponíveis para aquela situação.

Mapeamento visual de status:

| Status | Rótulo | Severidade PrimeNG |
|---|---|---|
| `PENDENTE` | Pendente | `warn` |
| `ATRASADO` | Atrasado | `danger` |
| `PAGO` | Pago | `success` |

O botão **Pagar** será renderizado somente em `PENDENTE` e `ATRASADO`. O botão **Ver recibo** será renderizado somente em `PAGO`.

A tela terá ainda:

- spinner durante a primeira consulta;
- mensagem específica quando não houver cobrança;
- botão **Atualizar** para consultar novamente o backend;
- pesquisa e paginação, de acordo com as tabelas atuais;
- texto explicando que novas cobranças aparecem mensalmente.

### 9.3. Diálogo de pagamento

Ao selecionar **Pagar**, o diálogo mostrará, sem permitir edição:

- descrição;
- vencimento;
- valor integral;
- seleção da forma de pagamento.

Formas aceitas:

```text
PIX
DINHEIRO
CARTAO
BOLETO
TRANSFERENCIA
```

O botão de confirmação ficará desabilitado enquanto `pagando()` for verdadeiro. O método também verificará esse signal antes de chamar o serviço, evitando duplo clique no frontend. A proteção definitiva contra pagamento duplicado permanece no backend.

Em caso de sucesso:

1. fechar o diálogo de confirmação;
2. armazenar o recibo retornado;
3. mostrar notificação de sucesso;
4. recarregar `/contareceber/minhas`;
5. abrir o diálogo do recibo.

### 9.4. Diálogo de recibo

O recibo mostrará os campos do contrato real de recebimento:

- identificador do recibo;
- descrição da conta;
- aluno;
- valor recebido;
- data do recebimento;
- forma de pagamento.

É importante usar `dataRecebimento`, e não `dataPagamento`, que pertence ao contrato visual do fluxo de salário.

## 10. Rota, menu e autorização

Será adicionada a rota:

```ts
{
  path: 'minhas-matriculas',
  loadComponent: () =>
    import('./components/conta-receber/minhas-matriculas/minhas-matriculas')
      .then((module) => module.MinhasMatriculas),
  canActivate: [roleGuard(['ALUNO'])],
}
```

Na sidebar do aluno será criada uma seção financeira, ou incluído um item equivalente:

```ts
{
  titulo: 'Financeiro',
  itens: [
    {
      label: 'Minhas matrículas',
      icon: 'pi pi-wallet',
      rota: '/minhas-matriculas',
    },
  ],
}
```

O item não aparecerá para `ADMIN` ou `MOTORISTA`. A URL também será protegida por `roleGuard(['ALUNO'])`; tentar acessá-la com outro papel levará a `/sem-permissao`.

O destino inicial atual do aluno continuará sendo `/rotas`. Isso evita alterar uma regra consolidada da autenticação; a área financeira estará acessível diretamente pelo menu.

Como complemento administrativo, a rota `/contas-receber` consulta `GET /contareceber/listar`. Essa tela é exclusiva de `ADMIN` e somente leitura; pagamento e recibo continuam restritos ao aluno autenticado.

## 11. Tratamento de erros

Será reutilizado `src/app/core/auth/api-error.ts`.

| Status | Comportamento da tela |
|---|---|
| `0` | O interceptor informa que o backend está indisponível; a tela encerra o carregamento sem duplicar o toast global. |
| `400` | Manter o diálogo aberto e informar forma de pagamento ou dados inválidos. |
| `401` | O interceptor encerra a sessão e retorna ao login. |
| `403` | O interceptor preserva a sessão e navega para “Sem permissão”. |
| `404` | Informar que a cobrança/recibo não existe ou não pertence ao aluno e recarregar a lista. |
| `409` | Fechar o diálogo, avisar que a cobrança já foi paga e recarregar a lista. |
| Outros | Exibir `mensagemApi(error)` em notificação de erro. |

O frontend nunca tentará distinguir, pelo conteúdo da resposta, se uma cobrança pertence a outro aluno. Para evitar vazamento de informação, mostrará apenas a mensagem genérica de recurso não encontrado/permissão definida pelo backend.

## 12. Segurança

As seguintes regras são obrigatórias:

- nenhum identificador de aluno será lido de parâmetro de rota ou formulário;
- o aluno será identificado exclusivamente pelo JWT no backend;
- a listagem usará somente `/contareceber/minhas`;
- o valor exibido será informativo e nunca editável;
- o POST terá corpo `null` e somente `formaPagamento` como query param;
- botões condicionais não substituirão a autorização do backend;
- o recibo será buscado pelo endpoint protegido;
- o frontend não marcará localmente uma cobrança como paga antes da resposta do servidor;
- a lista será consultada novamente após qualquer pagamento ou conflito.

## 13. Testes automatizados

### 13.1. Cadastro de aluno

- renderiza o campo mensalidade;
- impede valor nulo, zero e negativo;
- aceita valor positivo com duas casas decimais;
- envia `mensalidade` ao criar e ao editar;
- exibe erro da API por `MessageService`.

### 13.2. `ContaReceberService`

- usa `GET`;
- chama exatamente `${environment.apiUrl}/contareceber/minhas`;
- não envia `alunoId` nem `pessoaId`.

### 13.3. `RecebimentoService`

- usa `POST` em `/recebimentos/realizar/{id}`;
- envia corpo `null`;
- envia somente `formaPagamento` nos parâmetros;
- não envia valor, aluno ou pessoa;
- consulta recibo com `GET /recebimentos/recibo/conta/{id}`.

### 13.4. Componente

- mostra carregamento, erro e estado vazio;
- separa pendentes/atrasadas das pagas;
- aplica corretamente as tags de status;
- oferece **Pagar** somente para conta não paga;
- oferece **Ver recibo** somente para conta paga;
- impede confirmação duplicada enquanto a requisição está em andamento;
- recarrega a lista e abre recibo após sucesso;
- em `400`, mantém o diálogo aberto;
- em `404`, informa e recarrega;
- em `409`, fecha o diálogo e recarrega.

### 13.5. Navegação

- sidebar mostra **Minhas matrículas** para `ALUNO`;
- sidebar não mostra o item para `ADMIN` e `MOTORISTA`;
- a rota aceita `ALUNO`;
- a rota rejeita os demais papéis.

### 13.6. Comandos finais

```powershell
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p tsconfig.spec.json
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

## 14. Validação manual com o backend

1. Entrar como ADMIN.
2. Cadastrar um aluno com mensalidade maior que zero.
3. Criar a conta de acesso desse aluno, se ainda não existir.
4. Confirmar no backend/banco que a primeira cobrança tem vencimento em 30 dias.
5. Entrar como ALUNO.
6. Confirmar que o menu **Minhas matrículas** aparece.
7. Confirmar que a tela lista somente as cobranças desse aluno.
8. Pagar uma cobrança escolhendo uma forma de pagamento.
9. Confirmar que o valor não pode ser alterado no navegador.
10. Confirmar a mudança do status para `PAGO` e visualizar o recibo.
11. Consultar `/auth/me` e confirmar `statusMatricula: "ATIV0"`.
12. Tentar pagar a mesma cobrança novamente e validar o `409`.
13. Tentar acessar a rota como ADMIN e MOTORISTA e validar o bloqueio.
14. Validar `401`, `403`, `404`, backend indisponível e atualização da página.
15. Na data de vencimento, ou em teste controlado do backend, confirmar que apenas uma nova cobrança é criada com vencimento 30 dias depois.

## 15. Critérios de aceite

- [ ] Mensalidade faz parte do cadastro e da edição do aluno.
- [ ] Mensalidade inválida não é enviada.
- [ ] A rota `/minhas-matriculas` é exclusiva de `ALUNO`.
- [ ] O menu financeiro aparece apenas para o aluno.
- [ ] A listagem usa `/contareceber/minhas`.
- [ ] O frontend não envia aluno, pessoa ou valor ao pagar.
- [ ] Pendências e atrasos podem ser pagos.
- [ ] Contas pagas exibem recibo e não exibem ação de pagamento.
- [ ] Cliques duplicados são bloqueados.
- [ ] Sucesso e erros têm retorno visual.
- [ ] A tabela é recarregada após pagamento ou `409`.
- [ ] A autenticação JWT e os tratamentos globais continuam funcionando.
- [ ] Testes TypeScript, Karma e build de produção passam.
- [ ] `DOCUMENTACAO_APLICACAO.md` é atualizada após a implementação.

## 16. Fora do escopo

- alteração no backend;
- alteração no guia recebido;
- criação mensal de cobrança pelo Angular;
- edição manual do vencimento pelo aluno;
- pagamento parcial;
- seleção manual do aluno;
- ações de pagamento ou recibo para ADMIN;
- integração real com PIX, banco, boleto, cartão ou adquirente;
- webhook de confirmação financeira.

O pagamento desta etapa é um registro acadêmico/financeiro interno, da mesma forma que o pagamento de salário atual registra uma saída. Uma cobrança real exigiria integração com um provedor e confirmação assíncrona antes de marcar a conta como `PAGO`.
