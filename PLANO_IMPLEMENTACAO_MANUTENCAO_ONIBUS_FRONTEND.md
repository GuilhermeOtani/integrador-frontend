# Chamados de manutenção de ônibus — plano e implementação frontend

## 1. Objetivo e escopo

Entrega Angular implementada em 08/10/2026, baseada nos contratos de `GUIA_MANUTENCAO_ONIBUS_FRONTEND.md`. O backend e o guia recebido não foram modificados.

Os caminhos deste plano foram atualizados em 10/10/2026: manutenção está reunida em sua entidade, com `service/`, `models/`, `components/`, `utils/`, `styles/` e `testing/`. Essa reorganização preservou o comportamento e os mesmos 144 testes; resultados atuais em `DOCUMENTACAO_APLICACAO.md`.

Foram criadas duas páginas standalone, seguindo PrimeNG e a organização existente:

- **Meus chamados** (`/meus-chamados`): ALUNO e MOTORISTA relatam problemas e acompanham os próprios chamados.
- **Manutenção** (`/manutencao`): ADMIN consulta todos os chamados, identifica o solicitante, define prioridade, responde, resolve ou reabre e pode alterar explicitamente o estado do ônibus.

O cadastro de ônibus ganhou **Ver chamados**, direcionando para `/manutencao?onibusId=<id>`. As grades foram adaptadas para respeitar a disponibilidade sem apagar vínculos existentes.

Não fazem parte da entrega anexos, notificações automáticas, chat, histórico de respostas, custos, oficinas ou editor individual de viagens.

## 2. Modelo e autoria

A entidade de chamado reúne relato, ônibus, solicitante, prioridade e andamento. O vínculo com `Pessoa` preserva a autoria após exclusão apenas da conta de acesso (`Usuario`). Nome e papel refletem o cadastro atual; não são uma cópia histórica.

O fluxo de identificação é:

1. O interceptor existente envia o JWT à API.
2. O backend usa o `sub` para consultar o usuário autenticado.
3. A pessoa vinculada é registrada como solicitante.
4. O retorno inclui nome, papel e `pessoaId` para exibição.

O formulário envia **somente `onibusId` e `descricao`**. Não aceita nome, usuário, pessoa, prioridade ou andamento. O serviço também monta explicitamente o corpo permitido, evitando o envio acidental de outros campos.

Regras de negócio refletidas na interface:

- Abrir cria `ABERTO` com prioridade `MEDIA`, definidos pelo backend.
- Prioridade pertence ao chamado; estado operacional pertence ao ônibus.
- Abrir, resolver ou reabrir não altera automaticamente o ônibus.
- Alterar o estado do ônibus exige a escolha explícita do ADMIN.
- Nenhuma viagem é cancelada automaticamente.
- A resposta administrativa é única e atual: salvar substitui a anterior.
- Solicitantes podem selecionar qualquer ônibus cadastrado, inclusive indisponível, usando o endpoint reduzido.
- `/onibus` continua exclusivo do ADMIN.
- Não há edição, cancelamento ou exclusão de chamado pelo solicitante, nem exclusão administrativa de chamado.

## 3. Arquivos e responsabilidades

| Arquivo/pasta | Responsabilidade |
|---|---|
| `src/app/components/manutencao/models/manutencao.models.ts` | Contratos HTTP, enums e opções de apresentação compartilhadas |
| `src/app/components/manutencao/service/manutencao.service.ts` | Seis operações HTTP, filtros e corpos explicitamente permitidos |
| `src/app/components/manutencao/utils/manutencao.utils.ts` | Validação de texto, erros de campos, parsing do atalho, rótulos e severidades |
| `src/app/components/manutencao/components/meus-chamados/meus-chamados.ts` e `.html` | Consulta própria, abertura e detalhes |
| `src/app/components/manutencao/components/manutencao-admin/manutencao-admin.ts` e `.html` | Consulta filtrada e atendimento administrativo |
| `src/app/components/manutencao/components/chamado-detalhe/chamado-detalhe.ts` | Exibição compartilhada e segura do relato, autoria, ônibus e resposta |
| `src/app/components/manutencao/styles/manutencao.css` | Formulários, filtros responsivos e mensagens |
| `src/app/app.routes.ts` | Lazy loading e guards por papel |
| `src/app/components/sidebar/components/sidebar/sidebar.ts` | Menus específicos dos três papéis |
| `src/app/components/manutencao/testing/manutencao.fixtures.ts` | Dados compartilhados exclusivamente entre testes |
| Cadastro/modelo/listagem de ônibus | Estado tipado compartilhado, atalho e conflito de exclusão |
| Cadastro/listagem de grades | Disponibilidade, avisos, cópia independente e preservação de IDs/faculdades |
| Listagens de alunos e motoristas | Mensagens do backend em exclusões protegidas |
| Specs de manutenção e módulos afetados | Contratos, permissões, formulários, conflitos e preservação de dados |

Os novos formulários são reativos; dados e carregamento são signals. As grades mantêm o padrão legado de formulário por `ngModel`, sem reescrever o CRUD inteiro.

## 4. Contratos da API

```ts
type PrioridadeChamado = 'BAIXA' | 'MEDIA' | 'ALTA';
type StatusChamado = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
type StatusOnibus = 'OPERANDO' | 'MANUTENCAO' | 'QUEBRADO' | 'INATIVO';

interface OnibusChamado {
  id: number;
  numeroIdentificacao: string | null;
  placa: string | null;
  modelo: string | null;
  statusOnibus: StatusOnibus | null;
}

interface ChamadoManutencao {
  id: number;
  descricao: string;
  dataAbertura: string; // LocalDate: yyyy-MM-dd
  urgencia: PrioridadeChamado;
  status: StatusChamado;
  observacaoAdmin: string | null;
  onibus: OnibusChamado;
  solicitante: {
    pessoaId: number;
    nome: string;
    tipoPessoa: 'ALUNO' | 'MOTORISTA' | 'ADMIN';
  };
}

interface AbrirChamado { onibusId: number; descricao: string }
interface AtenderChamado {
  urgencia: PrioridadeChamado;
  status: StatusChamado;
  observacaoAdmin: string | null;
  statusOnibus?: StatusOnibus;
}
interface FiltrosChamado {
  status?: StatusChamado;
  urgencia?: PrioridadeChamado;
  onibusId?: number;
}
```

Os valores HTTP permanecem maiúsculos e sem acento. Rótulos visuais usam português. Dados antigos de ônibus nulos/vazios são apresentados como **Não informado**, sem assumir que o veículo está operando.

| Método e endpoint | Papel/uso |
|---|---|
| `GET /chamados-manutencao/onibus` | Três papéis; dados mínimos para seleção |
| `POST /chamados-manutencao` | ALUNO/MOTORISTA; abertura, retorno do chamado |
| `GET /chamados-manutencao/minhas` | ALUNO/MOTORISTA; somente autoria autenticada |
| `GET /chamados-manutencao/{id}` | ADMIN ou autor; detalhes atuais |
| `GET /chamados-manutencao` | ADMIN; consulta geral e filtros |
| `PUT /chamados-manutencao/{id}/atendimento` | ADMIN; atendimento e estado opcional do ônibus |

O serviço reutiliza `environment.apiUrl` e o interceptor JWT. Listas são arrays: paginação local do `p-table`, sem `page`, `size` ou identificação do usuário na URL. Filtros `status`, `urgencia` e `onibusId` só são enviados se preenchidos.

## 5. Meus chamados

Menu disponível para ALUNO/MOTORISTA; rota protegida por `roleGuard(['ALUNO', 'MOTORISTA'])`.

A tela possui toolbar com **Abrir chamado** e **Atualizar**, pesquisa local, ordenação, tabela paginada e tags. As colunas são número, ônibus, abertura, prioridade, andamento e detalhes. Carregamento, lista vazia, ausência de resultado e erro de consulta são apresentados separadamente.

A abertura contém:

- seletor pesquisável por identificação, placa e modelo;
- descrição obrigatória e não composta apenas por espaços, até 2.000 caracteres;
- contador de caracteres e orientação sobre autoria automática;
- botão de envio bloqueado durante a requisição e enquanto opções estão carregando/falharam.

Após sucesso, fecha, limpa, notifica e recarrega os próprios chamados. Em falha, conserva o relato e a seleção. Em `404`, atualiza as opções de ônibus sem apagar o formulário.

O detalhe sempre busca novamente por ID. Mostra relato, autoria, ônibus, estado atual, prioridade, andamento e resposta; sem resposta, exibe **Aguardando resposta**. Uma falha, inclusive `404`, fecha o detalhe sem mostrar informação antiga.

## 6. Manutenção administrativa

Menu **Manutenção** em Logística; rota protegida por `roleGuard(['ADMIN'])`.

A consulta inicial mostra todos os chamados na ordem do backend, exceto quando o atalho traz um ID válido. O parâmetro é validado como inteiro positivo seguro antes da primeira consulta; conteúdo inválido é ignorado.

Há filtros independentes por andamento, prioridade e ônibus, com **Aplicar**, **Limpar** e **Atualizar**. Atualizar usa os filtros já aplicados. A pesquisa local inclui solicitante, identificação/placa/modelo do veículo e descrição. Limpar remove também o parâmetro `onibusId` da URL e a pesquisa da tabela.

GETs antigos são cancelados ao substituir a consulta, evitando que uma resposta lenta sobrescreva filtros mais recentes. Nenhuma mutação é repetida automaticamente.

A tabela mostra número, ônibus, nome/papel do solicitante, data, prioridade, andamento e **Atender**. Antes da edição, consulta o chamado por ID.

O atendimento mantém autoria e relato em leitura. Seu formulário permite prioridade, andamento e resposta de até 2.000 caracteres. `RESOLVIDO` exige justificativa não vazia. Reabrir significa selecionar `ABERTO` ou `EM_ANDAMENTO` e salvar.

A resposta recebida é preservada no formulário. Apagar o texto envia `observacaoAdmin: null`, limpando a resposta atual.

**Alterar também o estado do ônibus** começa desmarcado a cada abertura. Somente ao marcar o checkbox o seletor de estado é habilitado e obrigatório. Desmarcado, `statusOnibus` é omitido, mesmo que haja um valor anterior no controle.

Toda alteração é feita exclusivamente por `/atendimento`; não usa o PUT do cadastro de ônibus e não sobrescreve foto, placa, capacidade ou outros campos. Após sucesso, fecha, notifica e atualiza chamados e opções de veículos.

## 7. Integração com grades e exclusões

O cadastro de ônibus e manutenção compartilham `StatusOnibus` e `ESTADOS_ONIBUS`.

No formulário de grade:

- a lista completa de ônibus é mantida para consultar os vínculos existentes;
- o seletor e a validação de novas viagens aceitam apenas `OPERANDO`;
- vínculos existentes com ônibus indisponível/sem estado exibem aviso;
- editar outros dados não apaga viagens existentes nem seus IDs;
- `faculdades` mantém o formato do backend; `faculdadesIds` é apenas seleção local de nova viagem;
- a grade inteira é copiada ao editar, incluindo viagens e faculdades, para cancelar sem alterar a listagem;
- um `409` conserva o formulário, apresenta a mensagem do servidor e recarrega a disponibilidade para revisão manual;
- não há editor individual de viagem nesta versão.

Exclusões individuais de ônibus, aluno e motorista mostram o conflito recebido em `409` e mantêm o registro na tabela. Para ônibus, recomendam `INATIVO` em vez de apagar vínculos. Excluir acesso em `/usuarios` continua preservando a pessoa e os chamados.

Importação e exclusão em massa persistente seguem como limitações legadas e não foram implementadas nesta entrega.

## 8. Erros e segurança

| HTTP | Comportamento |
|---|---|
| `400` | Mantém formulário; exibe mensagem e associa `ProblemDetail.errors` aos controles de manutenção |
| `401` | Interceptor existente encerra sessão |
| `403` | Interceptor existente abre Sem permissão |
| `404` | Detalhes não são exibidos; abertura conserva relato e atualiza ônibus; atendimento fecha e atualiza listas |
| `409` | Exibe conflito e conserva dados; nas grades recarrega disponibilidade |
| `0` | Aviso global já vem do interceptor; formulário é preservado para tentativa manual |

As telas novas não criam outro toast nem outro `MessageService`. Erros de formulário/lista aparecem inline; erros de detalhe usam o serviço global, sem duplicar notificações de `0`, `401` ou `403`.

Não repetir POST após falha de rede/timeout: a chamada pode ter sido gravada no servidor. O texto da interface orienta atualizar a lista antes de reenviar. Não existe chave de idempotência no contrato atual.

Relato e resposta são interpolados como texto Angular, sem `innerHTML`, com quebras de linha preservadas. Datas `LocalDate` usam `date:'dd/MM/yyyy':'UTC'` para preservar o dia.

## 9. Verificação automatizada

Cobertura acrescentada:

- métodos/URLs/filtros e corpos de abertura/atendimento;
- ausência de autoria e de campos extras no envio;
- limites de texto, espaços e bloqueio de envio duplicado;
- justificativa ao resolver, preservação/limpeza de observação e reabertura;
- estado do ônibus opcional, checkbox e ausência do campo quando desmarcado;
- menu e guard para cada papel e visitante;
- atalho, parsing e aplicação inicial/limpeza do filtro;
- carregamento, vazio, erros e descarte de GET antigo;
- renderização segura do texto e datas em UTC;
- somente veículos operando em novas viagens;
- preservação de IDs, ônibus e faculdades no PUT da grade;
- cancelamento sem alterar a listagem;
- conflitos de exclusão e permanência dos formulários.

Comandos de verificação, sem instalar novos frameworks:

```powershell
node_modules\.bin\tsc.cmd --noEmit -p tsconfig.app.json
node_modules\.bin\tsc.cmd --noEmit -p tsconfig.spec.json
node node_modules/@angular/cli/bin/ng.js test --watch=false --browsers=ChromeHeadless --no-progress
node node_modules/@angular/cli/bin/ng.js build --no-progress
```

Resultados reais da rodada final em 08/10/2026:

| Verificação | Resultado |
|---|---|
| TypeScript da aplicação | Aprovado |
| TypeScript dos testes | Aprovado |
| Karma / Chrome Headless | 144 de 144 aprovados |
| Build Angular de produção | Aprovado, sem erros |
| Bundle inicial | 1,09 MB bruto; 194,52 kB estimados para transferência |
| Verificação do diff | Sem erros de whitespace |

Resultados também registrados em `DOCUMENTACAO_APLICACAO.md`. O bloqueio de leitura do compilador pela sandbox Windows exigiu executar build/testes com autorização fora da sandbox; não foram alteradas dependências ou configurações de segurança do projeto.

## 10. Homologação com backend real

Pendente nesta entrega: uma consulta sem credenciais, fora da sandbox, confirmou conexão recusada em `localhost:8080`. Não foram fornecidas credenciais para autenticar os três papéis. Os testes automatizados usam doubles/HTTP de teste, não gravações no PostgreSQL.

Com backend atualizado e contas de teste:

1. Entrar como aluno e motorista; abrir chamados sem informar nome.
2. Confirmar que cada solicitante vê somente seus relatos e que detalhe de outro não é acessível.
3. Entrar como ADMIN; conferir autoria, filtros, pesquisa e atalho no ônibus.
4. Atualizar prioridade, resposta e andamento; resolver sem justificativa deve ser bloqueado.
5. Alterar explicitamente um veículo para `MANUTENCAO`; verificar o cadastro sem alteração dos outros dados.
6. Resolver sem marcar a alteração do ônibus; seu estado deve permanecer igual.
7. Reabrir preservando a resposta e testar limpeza intencional em chamado não resolvido.
8. Confirmar que novas viagens não aceitam veículos indisponíveis e que editar/cancelar uma grade mantém os vínculos existentes.
9. Simular mudança de disponibilidade entre abertura e salvamento; conferir `409`, formulário preservado e recarga dos ônibus.
10. Tentar exclusões físicas protegidas; verificar conflito, registro preservado e recomendação de inativação.
11. Excluir apenas um acesso, se apropriado em dados de teste; conferir preservação da pessoa e autoria.
12. Verificar sessão expirada, acesso proibido, rede indisponível, layout móvel e navegação por teclado.

O backend atualizado deve estar preparado e migrado conforme seu próprio guia. A implementação frontend não executa migrations, não reinicia o backend e não registra credenciais.
