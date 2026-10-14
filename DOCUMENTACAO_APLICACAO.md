# Documentação da Aplicação — Integrador Frontend

## 1. Visão geral

O **Integrador Frontend** é uma SPA administrativa para uma operação de transporte universitário. A aplicação foi desenvolvida com Angular, usa componentes standalone e consome uma API REST cuja URL está centralizada em `src/environments/environment.ts`.

O sistema possui autenticação JWT e três papéis:

- `ADMIN`: administra usuários e acessa os módulos administrativos;
- `ALUNO`: consulta rotas, pontos e grades, paga as próprias mensalidades e abre/acompanha seus chamados;
- `MOTORISTA`: consulta o próprio perfil e suas viagens e abre/acompanha seus chamados.

Além da autenticação, o frontend oferece os cadastros de transporte, contas a pagar/receber e chamados de manutenção com atendimento administrativo e alteração explícita do estado do ônibus.

Em 14/10/2026 foi implementada a **programação geral por e-mail**, exclusiva de ADMIN, na branch `codex/integracao-email`, baseada na principal `master`. A tela consulta a escala por faculdade, solicita envio/correção, controla o automático e acompanha lotes. Não inclui PDF ou seleção individual de destinatários. A integração WhatsApp ficou isolada em sua própria branch e não foi mesclada. A tela foi conferida com ADMIN e dados reais, em desktop/celular no modo escuro; SMTP real e modo claro permanecem pendentes.

Também em 14/10/2026, o frontend de **arquivamento de alunos e exclusão protegida** foi implementado em `/alunos`, com filtros, arquivamento individual/em lote, restauração sem reativação automática e consulta de vínculos antes da exclusão definitiva. A leitura do backend local ainda não encontrou os novos endpoints/campo; a interface bloqueia as novas ações diante de contrato antigo/incompatível, sem simular sucesso. Nenhum aluno real foi alterado. Homologação integrada e visual permanece pendente de implementação do guia no backend.

> **Estado da revisão:** dashboards por perfil implementados e reorganizados em cards objetivos em 10/10/2026, com transporte, mensalidade e pagamento compartilhado para aluno, escala para motorista e indicadores financeiros/operacionais para ADMIN. Os três perfis foram conferidos com backend real, em desktop e 360px no modo escuro; pagamento integrado e modo claro permanecem pendentes. Resultados na seção 11. Backend, guias recebidos e diagrama de classes permaneceram intactos.

---

## 2. Tecnologias e versões

### Dependências de execução

| Tecnologia | Versão | Uso |
|---|---:|---|
| Angular | `^21.2.3` | Aplicação, formulários, HTTP e roteamento |
| Angular Animations | `^21.2.3` | Animações exigidas pelos componentes PrimeNG |
| PrimeNG | `^21.1.3` | Componentes visuais |
| PrimeIcons | `^7.0.0` | Ícones |
| PrimeFlex | `^4.0.0` | Classes utilitárias |
| RxJS | `~7.8.0` | Fluxos HTTP e tratamento de respostas |
| Chart.js | `^4.5.1` | Gráfico financeiro de seis meses no dashboard ADMIN |
| Zone.js | `~0.15.0` | Integração Angular |

### Desenvolvimento e build

| Tecnologia | Versão |
|---|---:|
| Angular CLI | `^21.2.2` |
| Angular Build | `^21.2.2` |
| TypeScript | `~5.9.2` |
| Jasmine | `~5.9.0` |
| Karma | `~6.4.0` |
| Tailwind CSS | `^3.4.19` |
| PostCSS | `^8.5.8` |

O Angular 21 requer Node.js `^20.19.0`, `^22.12.0` ou `>=24.0.0`.

---

## 3. Arquitetura

### Inicialização global

`src/main.ts` inicializa a aplicação com `bootstrapApplication()`. `src/app/app.config.ts` registra:

- roteamento;
- `provideHttpClient()` com o interceptor JWT funcional;
- animações assíncronas;
- tema Aura do PrimeNG;
- `MessageService` global para notificações.

O componente raiz contém o toast global, oculta completamente a sidebar quando não existe sessão e renderiza o conteúdo por `router-outlet`.

### Organização principal

```text
src/
├── app/
│   ├── core/auth/
│   │   ├── service/auth.service.ts
│   │   ├── models/auth.models.ts
│   │   ├── guards/auth.guards.ts
│   │   ├── interceptors/auth.interceptor.ts
│   │   └── utils/api-error.ts
│   ├── components/
│   │   ├── email-programacao/
│   │   │   ├── models/email-programacao.models.ts
│   │   │   ├── service/email-programacao-service.ts
│   │   │   ├── utils/consulta-email.ts
│   │   │   ├── utils/email-programacao.utils.ts
│   │   │   ├── utils/solicitacao-pendente.ts
│   │   │   ├── testing/email-programacao.fixtures.ts
│   │   │   └── components/email-programacao/
│   │   ├── aluno/
│   │   │   ├── service/aluno-service.ts
│   │   │   ├── models/aluno.ts
│   │   │   └── components/
│   │   │       ├── aluno-cadastro/
│   │   │       └── aluno-listar/
│   │   ├── usuarios/
│   │   │   ├── service/usuario.service.ts
│   │   │   ├── models/usuario.models.ts
│   │   │   └── components/usuarios/
│   │   ├── manutencao/
│   │   │   ├── service/manutencao.service.ts
│   │   │   ├── models/manutencao.models.ts
│   │   │   ├── utils/manutencao.utils.ts
│   │   │   ├── styles/manutencao.css
│   │   │   ├── testing/manutencao.fixtures.ts
│   │   │   └── components/
│   │   │       ├── meus-chamados/
│   │   │       ├── manutencao-admin/
│   │   │       └── chamado-detalhe/
│   │   ├── faculdade/
│   │   ├── onibus/
│   │   ├── motorista/
│   │   ├── ponto-embarque/
│   │   ├── rota/
│   │   ├── grade-diaria/
│   │   ├── viagem/
│   │   ├── conta-pagar/
│   │   ├── conta-receber/
│   │   ├── login/components/login/
│   │   ├── perfil/components/perfil/
│   │   ├── sem-permissao/components/sem-permissao/
│   │   ├── dashboard/
│   │   │   ├── models/dashboard.models.ts
│   │   │   ├── service/dashboard-service.ts
│   │   │   ├── utils/
│   │   │   ├── styles/dashboard.css
│   │   │   ├── styles/dialog-dashboard.css
│   │   │   ├── testing/dashboard.fixtures.ts
│   │   │   └── components/
│   │   │       ├── inicio/
│   │   │       ├── dashboard-aluno/
│   │   │       ├── dashboard-motorista/
│   │   │       ├── dashboard-admin/
│   │   │       └── agenda-transporte/
│   │   └── sidebar/components/sidebar/
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.ts
└── environments/
    └── environment.ts
```

As páginas são carregadas com `loadComponent`, reduzindo o bundle inicial por lazy loading. Cada entidade tem suas próprias pastas `service/`, `models/` e `components/`, seguindo o exemplo de aluno acima. Os módulos faculdade, ônibus, motorista, ponto, rota, grade, viagem e contas seguem esse mesmo padrão. Pastas adicionais existem apenas quando há arquivos para elas.

Os `.spec.ts` ficam ao lado dos arquivos testados. Cada componente mantém TS, HTML, CSS próprio e spec juntos. O CSS compartilhado de manutenção fica em `styles/` e as fixtures em `testing/`. Não existe uma pasta global que reúna os serviços das entidades.

Manutenção foi reunida integralmente em seu módulo. `UsuarioService` e os contratos exclusivos da administração estão em usuários; `Papel`, `UsuarioResumo`, login, perfil, sessão e `ApiProblem` continuam como contratos compartilhados da autenticação. Não foram adicionadas cópias de contratos, aliases, reexportações ou dependências.

A reorganização de 10/10/2026 moveu 151 arquivos e preservou os 43 specs, incluindo os arquivos de manutenção ainda não commitados. Nomes de arquivos, classes, exports, endpoints, providers, rotas públicas e regras de negócio foram mantidos; apenas referências internas e localização foram alteradas, além da separação dos contratos administrativos.

---

## 4. Autenticação e autorização

### Sessão

`AuthService` mantém a sessão em um signal e persiste apenas na aba atual pelo `sessionStorage`, sob a chave:

```text
integrador.sessao
```

A sessão contém o access token, o tipo `Bearer`, o instante absoluto de expiração e o resumo do usuário, incluindo `ativo`. Na inicialização, o JSON armazenado é validado; conteúdo inválido, papel desconhecido, conta inativa, sessão antiga sem o campo `ativo` ou sessão expirada são descartados.

Após login ou restauração, um temporizador é agendado para encerrar a sessão exatamente em `expiresAt`. O logout cancela o temporizador, remove o armazenamento e redireciona para `/login`. Não há refresh token nem persistência em `localStorage`.

### Interceptor HTTP

O interceptor:

- envia `Authorization: Bearer <token>` somente para a URL configurada da API;
- não envia token em `POST /auth/login`;
- em `401`, limpa a sessão e volta ao login;
- em `403`, preserva a sessão e abre `/sem-permissao`;
- em status `0`, informa globalmente que o backend está indisponível;
- devolve o erro original às telas para tratamentos específicos.

### Guards

- `authGuard`: exige sessão válida;
- `guestGuard`: impede que usuário autenticado volte ao login;
- `roleGuard`: exige um dos papéis declarados na rota e retorna um `UrlTree` quando o acesso não é permitido.

Os guards e a ocultação de elementos melhoram a experiência, mas o backend continua sendo a autoridade final de autorização.

### Destinos após login

Uma URL interna de retorno é preservada quando o usuário é enviado ao login. Sem retorno, os destinos são:

| Papel | Destino |
|---|---|
| `ADMIN` | `/inicio` |
| `ALUNO` | `/inicio` |
| `MOTORISTA` | `/inicio` |

---

## 5. Rotas e menus por papel

| URL | Acesso | Finalidade |
|---|---|---|
| `/login` | Pública, apenas visitante | Autenticação |
| `/inicio` | `ADMIN`, `ALUNO`, `MOTORISTA` | Dashboard específico do papel |
| `/perfil` | Autenticado | Dados de `/auth/me` |
| `/sem-permissao` | Autenticado | Aviso de acesso negado |
| `/usuarios` | `ADMIN` | Administração de contas |
| `/programacao-email` | `ADMIN` | Prévia geral, envio/correção, automático e histórico de e-mails |
| `/alunos` | `ADMIN` | Cadastro/edição, arquivamento/restauração e exclusão protegida de alunos |
| `/faculdades` | `ADMIN` | CRUD de faculdades |
| `/onibus` | `ADMIN` | CRUD de ônibus |
| `/motoristas` | `ADMIN` | CRUD de motoristas |
| `/contapagar` | `ADMIN` | Contas, pagamentos e recibos |
| `/contas-receber` | `ADMIN` | Consulta de todas as mensalidades dos alunos |
| `/rotas` | `ADMIN`, `ALUNO` | Rotas e itinerários |
| `/pontosembarque` | `ADMIN`, `ALUNO` | Pontos de embarque |
| `/grades` | `ADMIN`, `ALUNO` | Grades diárias e viagens |
| `/minhas-matriculas` | `ALUNO` | Cobranças, pagamento e recibos do aluno autenticado |
| `/minhas-viagens` | `MOTORISTA` | Viagens do motorista autenticado |
| `/meus-chamados` | `ALUNO`, `MOTORISTA` | Abrir e acompanhar os próprios relatos |
| `/manutencao` | `ADMIN` | Consultar e atender chamados de manutenção |

`/onibuss` foi mantida como redirecionamento de compatibilidade para `/onibus`. A raiz, URLs desconhecidas e login já autenticado redirecionam para `/inicio`. O menu Início é o primeiro item dos três papéis; Meu perfil permanece disponível.

A sidebar calcula os itens pelo papel, exibe nome, papel e iniciais reais do usuário e executa o logout. Ela fica invisível no login e sempre que não existe sessão.

Para `ALUNO`, rotas, grades e pontos ficam em modo de leitura: botões de criar, importar, excluir em massa, editar e excluir não são renderizados. Pesquisa, paginação, exportação e detalhes continuam disponíveis. A sidebar também oferece **Minhas matrículas**, dentro da seção Financeiro, somente para esse papel.

**Meus chamados** aparece em Transporte para ALUNO e em Operação para MOTORISTA. O ADMIN recebe **Manutenção** em Logística. **Ver chamados**, na tabela de ônibus, abre `/manutencao?onibusId=<id>` com filtro aplicado antes da consulta; limpar os filtros remove também o parâmetro.

**Programação por e-mail** aparece somente em Logística do ADMIN. Em Grades, o atalho **Enviar programação de hoje** apenas navega para `/programacao-email`, sem iniciar envio. ALUNO/MOTORISTA continuam usando seus dashboards e recebem a mensagem no e-mail da conta; não há tela pessoal de assinatura de e-mail no contrato atual.

---

## 6. Telas de autenticação e usuários

### Login

Formulário reativo com e-mail e senha, validação, estado de carregamento e mensagem genérica para credenciais inválidas. Erro de conexão é apresentado como backend indisponível.

### Meu perfil

Consome `GET /auth/me`, mostra dados comuns da pessoa e blocos específicos de aluno ou motorista. O enum de matrícula é mantido conforme o contrato do backend: `ATIV0`, `INATIV0` e `PENDENTE`; apenas a apresentação converte os textos para o usuário.

### Sem permissão

Informa o bloqueio sem encerrar a sessão e oferece retorno ao perfil ou ao início adequado ao papel.

### Administração de usuários

A tela `/usuarios` permite ao administrador:

- listar contas existentes;
- listar alunos e motoristas que ainda não possuem usuário;
- criar conta vinculada a uma pessoa;
- criar outro administrador;
- editar o e-mail de acesso;
- redefinir a senha sem expor seu conteúdo;
- desativar ou reativar contas;
- excluir somente o acesso, preservando a pessoa vinculada.

Os formulários usam e-mail, senha entre 8 e 72 caracteres e confirmação local. A tabela identifica contas ativas e inativas e concentra as operações em um menu por usuário. Desativar exige confirmação; excluir fica em uma seção perigosa e exige confirmação explícita informando que a pessoa será preservada. Desativação e exclusão ficam bloqueadas visualmente para a própria conta.

Editar o próprio e-mail ou redefinir a própria senha encerra a sessão após o sucesso. Alterações sensíveis revogam os tokens anteriores no backend; o interceptor trata o `401` subsequente com logout. Em `400`, erros de campo são associados ao formulário; `404` fecha o diálogo e recarrega os dados; `409` mantém o formulário aberto e mostra conflitos como e-mail duplicado ou proteção do último administrador ativo.

### Minhas viagens

A página chama somente `GET /viagem/minhas`; o frontend não envia `motoristaId`. Ela apresenta data, rota, ônibus e faculdades, além dos estados de carregamento, lista vazia e erro.

### Início por perfil

O distribuidor em `/inicio` instancia somente o componente do papel atual. `DashboardService` usa `GET /dashboard/aluno`, `GET /dashboard/motorista` ou `GET /dashboard/admin`, sem identificação de pessoa na requisição. Apenas ADMIN pode enviar o mês opcional `mes=yyyy-MM`.

ALUNO encontra nome/faculdade no cabeçalho e quatro cards separados: Ônibus, Pontos de embarque (até três), Rota e viagem e Mensalidade. A cobrança principal escolhida pelo backend mostra valor, vencimento, prazo e ação de pagar/recibo. Cadastro, endereços, mensalidade cadastrada e totais ficam nos detalhes, sem confundir mensalidade com cobrança. Vencimento é da cobrança, não expiração automática da matrícula.

MOTORISTA recebe suas atribuições em cards de Ônibus, Pontos, Rota e Destinos, com programação compacta. ADMIN recebe cards mensais e de contas, quatro cards operacionais com diálogos, gráfico de seis meses com tabela recolhida e pendências com alternância Receber/Pagar. Trocar mês cancela GET anterior; pendências e operação permanecem posição atual de todos os períodos. Saldo das movimentações não representa lucro ou saldo bancário.

`AgendaTransporte` compartilha cards, seletor e diálogos entre aluno/motorista. A seleção inicial é a primeira viagem de hoje ou próxima ocorrência, identificada por ID e data; a chave é preservada no componente do perfil durante atualização e retorna à primeira disponível se desaparecer. Todos os cards de transporte correspondem à mesma ocorrência. Hoje é deduplicado da agenda, seções vazias/repetidas são omitidas e dados completos permanecem nos diálogos. Pontos preservam a ordem recebida; não existe ponto individual nem ônibus exclusivo do aluno. Datas vêm do backend. Avisos iguais são deduplicados; veículo indisponível permanece visível, sem cancelamento automático. Layout em duas colunas no computador e uma até 768px; estilos específicos do ADMIN em `dashboard-admin.css`.

Os diálogos do dashboard compartilham `styles/dialog-dashboard.css`: destaque principal com ícone e status, blocos de informação com bordas suaves, itinerário numerado e destinos em cards. O resumo do aluno separa cobrança, valores complementares e cadastro; o ADMIN destaca totais operacionais e oferece acesso ao módulo correspondente. No celular, os campos ficam em uma coluna e o status abaixo da identificação. O conteúdo rola dentro do diálogo, mantendo o rodapé com Fechar disponível. Pagamento e recibo existentes não foram redesenhados nesta etapa.

Dados ausentes aparecem como Não informado, sem números/estados fictícios. LocalDate é apresentado em UTC, geradoEm em São Paulo e valores em BRL. Signals e `ConsultaDashboard<T>` controlam carregamento/erro e cancelamento; não há cache persistido nem polling. O erro oculta dados antigos e não vira estado vazio.

Documento detalhado: `PLANO_IMPLEMENTACAO_DASHBOARD_FRONTEND.md`.

### Minhas matrículas

A página `/minhas-matriculas` chama `GET /contareceber/minhas` e mostra somente as cobranças do aluno identificado pelo JWT. A interface separa cobranças em aberto do histórico, oferece pesquisa, paginação e atualização manual e apresenta valor, vencimento e status `PENDENTE`, `ATRASADO` ou `PAGO`.

O aluno pode pagar cobranças pendentes ou atrasadas escolhendo apenas a forma de pagamento. O diálogo mostra o valor integral sem permitir edição e chama `POST /recebimentos/realizar/{contaId}` com corpo `null` e somente o query param `formaPagamento`. O frontend nunca envia `alunoId`, `pessoaId` ou valor do pagamento.

Após sucesso, a lista é recarregada e o recibo retornado é aberto. Cobranças pagas oferecem `GET /recebimentos/recibo/conta/{contaId}`. O botão é bloqueado durante a requisição; um `409` fecha o diálogo e atualiza os dados, enquanto `400` mantém a confirmação aberta com a mensagem de validação.

O pagamento/recibo agora é concentrado em `conta-receber/components/pagamento-matricula/`, compartilhado com o início do aluno. Usa `CobrancaParaPagamento`, formulário reativo de forma de pagamento e seleção copiada para o recibo. A instância permanece montada durante a atualização. Em resposta de rede incerta não há repetição automática: solicita revisão das cobranças antes de novo envio. O sucesso continua válido mesmo se a reconsulta falhar, preservando o recibo e informando o erro da atualização. É registro interno, sem gateway bancário.

A primeira cobrança, o vencimento em 30 dias e as próximas cobranças mensais são controlados pelo backend. O Angular apenas consulta novamente os dados; ele não possui agendador nem cria contas localmente.

As telas de contas a receber seguem o mesmo padrão visual de Contas a pagar: barra de alternância, tabelas separadas para pendências e histórico, valores em vermelho/verde e os mesmos cards de confirmação e recibo. No recebimento, o valor aparece bloqueado porque deve vir integralmente da cobrança.

---

## 7. Módulos administrativos existentes

### Cadastros principais

- **Alunos:** dados pessoais, matrícula, status, mensalidade obrigatória maior que zero e faculdade;
- **Faculdades:** nome, endereço e telefone;
- **Ônibus:** identificação, placa, modelo, capacidade, status e foto em Data URL/base64;
- **Motoristas:** dados pessoais, CNH e salário;
- **Pontos de embarque:** descrição e ordem de parada;
- **Rotas:** nome, descrição, faculdade e sequência de pontos;
- **Grades diárias:** data, descrição e viagens aninhadas com rota, ônibus, motorista e faculdades.

### Arquivamento de alunos e exclusão protegida

O módulo de alunos envia o filtro `situacao=NAO_ARQUIVADOS|ARQUIVADOS|TODOS` ao servidor; o padrão é não arquivados, incluindo matrículas pendentes. O campo `arquivado` é separado do status de matrícula. A interface apresenta estados de carregamento, erro e ausência, preserva dados antigos em falha de atualização e bloqueia ações sobre listas não confirmadas. Respostas anteriores sem `arquivado` mantêm apenas a leitura do cadastro principal com aviso de backend pendente, sem inventar estado ou filtros.

Arquivar exige confirmação explícita, chama `PATCH /aluno/{id}/arquivamento` com apenas `{ arquivado: true }` e atualiza a linha somente após resposta compatível de sucesso. O lote utiliza os mesmos PATCHs sequencialmente, deduplica IDs, mostra resultados por aluno e conserva os itens falhos selecionados. Isso substitui a antiga exclusão em lote que apenas removia linhas da memória. Em conexão/status 408/5xx ou falha de autorização, interrompe os itens restantes, não repete requisições e pede atualização da lista antes de novas operações. Resultados concluídos não são desfeitos por falhas posteriores.

Restaurar usa `{ arquivado: false }` e informa que o administrador precisa reativar o acesso separadamente em Usuários. Arquivamento, bloqueio de login, supressão de e-mails, interrupção da recorrência e preservação do histórico são responsabilidades do backend, não efeitos simulados no Angular. Cadastro/edição enviam apenas os campos do DTO, sem `arquivado`, usuário, e-mail ou objetos relacionados.

Somente os arquivados oferecem consulta de exclusão definitiva: `GET /aluno/{id}/situacao-exclusao`. O diálogo apresenta as quatro contagens, impedimentos completos e existência de acesso. Campos ausentes, contagens inválidas, aluno diferente ou uma autorização contraditória não habilitam DELETE. A confirmação irreversível chama o DELETE existente; a API deve revalidar vínculos. Em `409`, preserva a linha, mostra mensagem/contagens novas e descarta a autorização anterior. Fechar/destruir cancela consultas e interrompe o lote; não existe exclusão definitiva em lote ou armazenamento local de arquivamento.

Detalhamento: `PLANO_IMPLEMENTACAO_ARQUIVAMENTO_ALUNOS_FRONTEND.md`. Contrato para implementação backend: `GUIA_ARQUIVAMENTO_ALUNOS_BACKEND.md`. Guias recebidos, backend e diagrama permanecem intactos.

### Contas a pagar

A interface lista contas, separa pagas das pendentes/atrasadas, realiza pagamento e consulta recibo. O serviço possui atualização de conta, mas a tela não oferece CRUD completo de contas.

### Contas a receber da matrícula

O módulo mantém contratos tipados para conta, status financeiro, forma de pagamento e recibo. Para o ADMIN, `/contas-receber` consulta todas as mensalidades em modo somente leitura, separando contas abertas do histórico e permitindo pesquisa por aluno, descrição e status. Para o ALUNO, `/minhas-matriculas` mostra somente as próprias cobranças e oferece pagamento e recibo.

`ContaReceberService` mantém separadas as consultas `/listar` e `/minhas`. `RecebimentoService` registra o pagamento ou busca o recibo apenas no fluxo do aluno. A identidade e o valor são sempre validados pelo backend; a consulta administrativa não oferece ações financeiras.

### Chamados de manutenção e disponibilidade

As páginas novas são standalone com formulários reativos, signals, toolbar, pesquisa, paginação local, tags e diálogos. O serviço usa a API e o interceptor existentes. O backend identifica o solicitante pelo JWT e sua `Pessoa`; o Angular nunca envia autoria na abertura.

**Meus chamados** permite selecionar qualquer ônibus, inclusive indisponível, descrever o problema (obrigatório, não apenas espaços, até 2.000 caracteres) e consultar detalhes atualizados. O chamado nasce `ABERTO`/`MEDIA` no servidor. Não há edição, cancelamento ou exclusão pelo solicitante.

**Manutenção** lista os relatos com nome/papel do solicitante e filtros por status, urgência e ônibus. O ADMIN busca o detalhe antes de atender e pode alterar prioridade, andamento e resposta de até 2.000 caracteres. Resolver exige justificativa; reabrir significa selecionar `ABERTO` ou `EM_ANDAMENTO`. A resposta recebida é preservada; apagar o texto envia `null`. A resposta é atual, substituída ao salvar, e não um histórico/chat.

O checkbox **Alterar também o estado do ônibus** inicia desmarcado. Só quando marcado habilita o seletor e envia `statusOnibus`. A alteração usa exclusivamente o endpoint de atendimento e não regrava foto, placa, capacidade ou outros campos. Resolver não libera o ônibus automaticamente; nenhuma viagem é cancelada.

No cadastro e manutenção, estados compartilham o mesmo tipo/opções: `OPERANDO`, `MANUTENCAO`, `QUEBRADO`, `INATIVO`. Dados antigos nulos são apresentados como **Não informado**.

Nas grades, a lista completa permite consultar o estado de vínculos existentes, mas novas viagens só selecionam `OPERANDO`. Veículos indisponíveis/sem estado recebem aviso no formulário. Editar copia profundamente a grade, viagens e faculdades; cancelar não altera a listagem. O envio preserva os IDs existentes e o formato `faculdades` do backend. Em `409`, conserva os dados e recarrega disponibilidade para revisão manual. Não foi criado editor individual de viagens.

Exclusões individuais de ônibus, aluno e motorista exibem o conflito do backend e não removem a linha em falha. Para ônibus, recomenda-se `INATIVO` em vez de exclusão. Excluir apenas a conta de acesso preserva a pessoa e autoria.

Detalhamento dos arquivos, contratos e homologação: `PLANO_IMPLEMENTACAO_MANUTENCAO_ONIBUS_FRONTEND.md`.

### Programação geral por e-mail

Implementação na entidade `src/app/components/email-programacao/`, com componentes standalone/PrimeNG, signals e formulários reativos, sem dependências novas. Referência detalhada: `PLANO_IMPLEMENTACAO_EMAIL_FRONTEND.md`.

- **Público:** ALUNO/MOTORISTA com `Usuario.ativo=true`, endereço de `Usuario.email`; ADMIN e pessoas sem conta ficam fora. Não filtra por faculdade ou situação da matrícula. Em teste, o backend restringe à lista permitida e deduplica os e-mails.
- **Conteúdo:** todos recebem a mesma programação geral de hoje, agrupada por faculdade e destacando identificação do ônibus/motorista, com rota, itinerário e avisos. Cada mensagem tem um destinatário visível; sem lista coletiva e sem PDF. O backend considera todas as grades do dia; não usa data antiga de viagem nem inventa horário ou vínculo individual aluno–ônibus.
- **Consulta:** cards por faculdade, pesquisa local, itinerário/destinos em diálogo, prévia textual exata e configurações/impedimentos. Pesquisar não filtra o conteúdo enviado. Uma viagem de vários destinos aparece nas seções pertinentes sem inflar a quantidade total de viagens.
- **Envio:** confirmação explícita, UUID por intenção, corpo mínimo e bloqueio de envio duplicado/sem viagens/sem elegíveis/sem disponibilidade/dados desatualizados. Correção exige motivo com 1–500 caracteres úteis, com limite de 500 no campo e validação de espaços, e avisa que a mensagem anterior não será apagada.
- **Resultado incerto:** `sessionStorage` em `integrador.email.request.<adminId>`, com envelope validado e corpo exato. Sem token adicional, lista de destinatários ou credenciais. Não repete POST automaticamente nem cria outro UUID para contornar falha. Recarga apenas restaura; consultar o ID localiza o lote. Intenção de outro dia exige consulta e resolução explícita antes de uma nova ação. Falha de storage conserva a intenção em memória e mostra aviso.
- **Automático:** PUT confirmado às 15h de São Paulo, com recuperação antes das 18h no backend. Chave não otimista; permite desligar mesmo com SMTP indisponível. Desligar não cancela mensagens enfileiradas. Navegador não agenda; backend precisa ficar ligado.
- **Histórico:** paginação do servidor 20/50/100, total de `totalElementos`, ordem da API. Detalhe consulta entregas e conteúdo congelado do lote, não a prévia atual. `ignorados` inclui seleção inicial e duplicidade diária, não apenas duplicidades.
- **Atualização:** GETs independentes/canceláveis, dados antigos marcados como desatualizados em erro. Detalhe atualiza a cada cinco segundos apenas em PENDENTE/PROCESSANDO, até dez minutos, sem sobrepor GETs; fechamento, destruição, erro, conclusão e limite encerram inclusive requisições lentas.
- **Estados:** PENDENTE, PROCESSANDO, ACEITA_SMTP, FALHA, INCERTA, SUPRIMIDA, EXPIRADA. HTTP 202 significa registro para processamento; ACEITA_SMTP significa aceite pelo servidor, nunca prova de caixa de entrada/leitura. Sem webhook de entrega/rastreamento nesta versão.
- **Erros:** reutiliza `mensagemApi`/`problemaApi`; 400 associa errors ao motivo e mantém diálogo; 409 preserva intenção e informa conflito; 404 informa lote não localizado; status 0/408/5xx preservam UUID. Interceptor permanece responsável por 401/403/status 0, sem novo interceptor ou toast duplicado da feature.
- **Segurança:** texto por interpolação, sem HTML confiado artificialmente, editor livre ou credenciais SMTP no Angular. Datas civis preservam o dia; instantes usam São Paulo. Opções de banco/Flyway, configuração SMTP, template HTML e seleção de destinatários permanecem no backend.

Para homologação, configurar SMTP externamente, com `EMAIL_PRODUCTION=false`, `EMAIL_TEST_RECIPIENTS` de contas ativas controladas, `EMAIL_ENABLED=true` e `EMAIL_SCHEDULERS_ENABLED=true` (também necessário à fila manual). Automático deve permanecer desligado até recebimento real conferido. Consultar configuração/prévia/histórico não requer SMTP funcional; `disponivel=true` não testa credenciais. Não precisa Meta, número de celular ou callback público para este fluxo SMTP. Nenhum envio real nem ativação automática foi feito durante a implementação frontend.

### Limitações legadas ainda existentes

- os botões de importação de alguns cadastros são apenas visuais;
- a exclusão em massa remove itens apenas da tabela local e não envia todos os `DELETE` ao backend;
- parte dos formulários legados usa validação visual/incompleta, sem formulário reativo;
- máscaras de CPF/CNPJ e CNH não validam dígitos verificadores;
- a relação motorista–ônibus não existe no modelo de motorista atual.

---

## 8. Contratos de autenticação

| Método | Endpoint | Corpo/retorno principal |
|---|---|---|
| POST | `/auth/login` | `{ email, senha }` → token, expiração e usuário |
| GET | `/auth/me` | Perfil completo do usuário autenticado |
| GET | `/usuarios` | `UsuarioResumo[]` |
| GET | `/usuarios/pessoas-sem-usuario` | Pessoas disponíveis para vinculação |
| POST | `/usuarios` | `{ pessoaId, email, senha }` |
| POST | `/usuarios/admin` | `{ nome, email, senha }` |
| PATCH | `/usuarios/{id}` | `{ email }` → `UsuarioResumo` |
| PUT | `/usuarios/{id}/senha` | `{ senha }` → `204 No Content` |
| PATCH | `/usuarios/{id}/status` | `{ ativo }` → `UsuarioResumo` |
| DELETE | `/usuarios/{id}` | Exclui somente o acesso → `204 No Content` |
| GET | `/viagem/minhas` | `Viagem[]` do token autenticado |

Papéis aceitos: `ADMIN`, `ALUNO` e `MOTORISTA`.

`UsuarioResumo` inclui `ativo`, mas nunca inclui senha, hash ou versão do token. Papel, nome e pessoa vinculada não são editáveis pelos endpoints administrativos de acesso.

O utilitário de erro aceita respostas no formato Problem Detail, inclusive o mapa `errors`, e fornece mensagens para `400`, `401`, `403`, `404`, `409`, status `0` e erros inesperados.

---

## 9. Endpoints dos módulos existentes

A base é obtida de `environment.apiUrl`, atualmente `http://localhost:8080`.

### CRUDs

| Recurso | Listar | Criar | Atualizar | Excluir |
|---|---|---|---|---|
| Aluno | `GET /aluno/listar` | `POST /aluno/salvar-aluno` | `PUT /aluno/atualizar-aluno/{id}` | `DELETE /aluno/deletar-aluno/{id}` |
| Faculdade | `GET /faculdade/listar` | `POST /faculdade/salvar-faculdade` | `PUT /faculdade/atualizar-faculdade/{id}` | `DELETE /faculdade/deletar-faculdade/{id}` |
| Ônibus | `GET /onibus/listar` | `POST /onibus/salvar-onibus` | `PUT /onibus/atualizar-onibus/{id}` | `DELETE /onibus/deletar-onibus/{id}` |
| Motorista | `GET /motorista/listar` | `POST /motorista/salvar-motorista` | `PUT /motorista/atualizar-motorista/{id}` | `DELETE /motorista/deletar-motorista/{id}` |
| Ponto | `GET /ponto-embarque/listar` | `POST /ponto-embarque/salvar-pontoEmbarque` | `PUT /ponto-embarque/atualizar-pontoEmbarque/{id}` | `DELETE /ponto-embarque/deletar-pontoEmbarque/{id}` |
| Rota | `GET /rota/listar` | `POST /rota/salvar-rota` | `PUT /rota/{id}` | `DELETE /rota/deletar-rota/{id}` |

### Grades e viagens

| Recurso | Endpoints |
|---|---|
| Grade diária | `GET /grade-diaria/listar`, `POST /grade-diaria/salvar-grade`, `GET /grade-diaria/buscar-grade/{id}`, `PUT /grade-diaria/atualizar-grade/{id}`, `DELETE /grade-diaria/deletar-grade/{id}` |
| Viagem | `GET /viagem/listar`, `POST /viagem/salvar-viagem`, `GET /viagem/buscar-viagem/{id}`, `PUT /viagem/atualizar-viagem/{id}`, `DELETE /viagem/deletar-viagem/{id}`, `GET /viagem/minhas` |

### Contas e pagamentos

| Método | Endpoint | Observação |
|---|---|---|
| GET | `/contapagar/listar` | Lista contas |
| PUT | `/contapagar/atualizar-contapagar/{id}` | Atualiza uma conta |
| POST | `/pagamentos/realizar/{contaId}` | Query params `formaPagamento` e, opcionalmente, `valorPago` |
| GET | `/pagamentos/recibo/conta/{contaId}` | Consulta recibo |
| GET | `/contareceber/listar` | Lista todas as contas para consulta do ADMIN |
| GET | `/contareceber/minhas` | Lista somente as cobranças do aluno autenticado |
| POST | `/recebimentos/realizar/{contaId}` | Corpo `null`; query param `formaPagamento`; não recebe valor ou aluno |
| GET | `/recebimentos/recibo/conta/{contaId}` | Consulta recibo protegido da matrícula |

### Chamados de manutenção

| Método | Endpoint | Acesso/contrato |
|---|---|---|
| GET | `/chamados-manutencao/onibus` | Três papéis; dados mínimos dos ônibus |
| POST | `/chamados-manutencao` | ALUNO/MOTORISTA; `{ onibusId, descricao }` |
| GET | `/chamados-manutencao/minhas` | ALUNO/MOTORISTA; próprios chamados |
| GET | `/chamados-manutencao/{id}` | ADMIN ou autor; detalhe atual |
| GET | `/chamados-manutencao` | ADMIN; filtros opcionais `status`, `urgencia`, `onibusId` |
| PUT | `/chamados-manutencao/{id}/atendimento` | ADMIN; `{ urgencia, status, observacaoAdmin, statusOnibus? }` |

O retorno contém `id`, `descricao`, `dataAbertura` (`yyyy-MM-dd`), `urgencia`, `status`, `observacaoAdmin`, `onibus` (`id`, `numeroIdentificacao`, `placa`, `modelo`, `statusOnibus`) e `solicitante` (`pessoaId`, `nome`, `tipoPessoa`). Número, placa, modelo e estado podem ser nulos.

Prioridades: `BAIXA`, `MEDIA`, `ALTA`. Andamentos: `ABERTO`, `EM_ANDAMENTO`, `RESOLVIDO`. Listas são arrays, sem parâmetros `page`/`size`. Datas usam UTC na apresentação. Relato e resposta são texto interpolado, preservando quebras de linha, sem `innerHTML`.

As telas reutilizam `mensagemApi`/`problemaApi`: `400` associa erros aos controles, `409` conserva formulários, `404` impede mostrar detalhes e atualiza opções quando necessário. `401`/`403`/status `0` mantêm o tratamento global. Não há repetição automática de POST após erro de rede; o usuário deve atualizar a lista antes de reenviar, pois a abertura pode ter sido registrada.

---

### Endpoints de programação por e-mail

Todos exigem ADMIN e usam o interceptor JWT existente:

| Método | Caminho | Contrato |
|---|---|---|
| GET | `/integracoes/email/configuracao` | `ConfiguracaoEmail`: habilitado, automatico, modoTeste, disponivel, horario, fuso e impedimentos |
| PUT | `/integracoes/email/configuracao` | `{ automatico }` → `ConfiguracaoEmail` |
| GET | `/integracoes/email/previa` | `PreviaEmail`: dataReferencia, geradoEm, contagens, viagens, avisos e mensagem |
| POST | `/integracoes/email/envios` | `{ requestId, reenviar, motivo? }` → `LoteEmail`, HTTP 202 |
| GET | `/integracoes/email/envios?pagina=0&tamanho=20` | `HistoricoEmail`: pagina, tamanho, totalElementos, totalPaginas e itens |
| GET | `/integracoes/email/envios/{id}` | `LoteEmail` com entregas e mensagem congelada |

Os contratos completos estão em `components/email-programacao/models/email-programacao.models.ts`; transporte reutiliza `ViagemResumo`. Request usa `reenviar`, resposta usa `reenvio`. O histórico omite conteúdo/entregas (`mensagem=null`, `entregas=[]`), por isso a tela busca detalhes por ID. Não existem endpoints de PDF, inscrição pessoal, confirmação de telefone ou escolha de destinatário nesta integração.

## 10. Instalação e execução

### Pré-requisitos

- Node.js compatível com Angular 21;
- npm;
- backend e PostgreSQL ativos;
- backend acessível em `http://localhost:8080` e CORS liberado para o frontend.

### Comandos

```bash
npm install
npm start
```

O servidor de desenvolvimento usa normalmente `http://localhost:4200`.

```bash
npm run build
npm test -- --no-watch --no-progress --browsers=ChromeHeadless
```

O build é gravado em `dist/integrador-frontend`. Não há framework E2E configurado.

Credenciais administrativas não devem ser registradas no código, documentação, fixtures ou histórico Git; devem ser digitadas diretamente no navegador durante a validação integrada.

---

## 11. Testes automatizados

Atualização de 14/10/2026, arquivamento de alunos (estado mais recente):

| Verificação | Resultado |
|---|---|
| Baseline anterior, com e-mail | 292/292 aprovados, 54 specs |
| TypeScript da aplicação/testes | Aprovados |
| Karma + Chrome Headless | **351/351 aprovados**, 55 specs |
| Acréscimo | 59 testes líquidos, incluindo serviço, tela, contratos defensivos e permissões de `/alunos` |
| Build de produção | Aprovado; resultado final registrado no plano do arquivamento |
| Alterações em alunos reais | Nenhuma |
| Backend / validação visual integrada | Pendentes; backend local ainda sem as novas APIs/campo na inspeção desta entrega |

A suíte cobre filtros no servidor, cancelamento de consultas, backend antigo/incompatível, confirmação/cancelamento, duplo clique, restauração sem reativação, lote sequencial/parcial/interrompido, preservação de seleção/linhas, respostas incertas, vínculos completos, `409` na exclusão e interpolação segura. Mantém as regressões de pagamento, e-mail, auth e dashboards. Estes testes utilizam HTTP simulado e não comprovam regras de banco, transações ou revogação de JWT no backend.

Histórico da entrega de 14/10/2026, programação por e-mail:

| Verificação | Resultado |
|---|---|
| Baseline da `master` | **209/209 aprovados**, 50 specs |
| TypeScript da aplicação/testes | Aprovados |
| Karma + Chrome Headless | **292/292 aprovados**, 54 specs |
| Acréscimo | 83 testes, incluindo serviço, utilitários, storage, tela, rota/menu e atalho |
| Build Angular de produção final | Aprovado; 1,09 MB bruto / 194,53 kB estimados, sem avisos |
| SMTP real / envio / automático | Não executados; configuração externa/homologação pendentes |
| Conferência visual autenticada | ADMIN com dados reais, 1440px/360px, modo escuro; prévia e itinerário conferidos |

Foi corrigido um encerramento de polling que inicialmente deixava uma consulta lenta terminar depois do limite; o limite de dez minutos agora cancela também a requisição interna. A suíte final passou após essa correção. Testes verificam estados reais, conteúdo congelado, preservação do UUID/corpo após status 0/408/5xx, recarga, isolamento por administrador, 400/404/409, storage bloqueado, virada do dia, dupla confirmação, disponibilidade, mudança de página/lote, datas e texto seguro. Testes HTTP não enviam e-mails reais.

O shim global de `npm` apontou para `npm-cli.js` ausente neste computador. A validação foi feita chamando os binários locais com `node node_modules/typescript/bin/tsc` e `node node_modules/@angular/cli/bin/ng.js`, sem modificar dependências. Karma/build precisaram da permissão de leitura fora da sandbox Windows. No navegador, `/programacao-email` sem sessão mostrou `/login?retorno=%2Fprogramacao-email`, sem sidebar; não foram digitadas credenciais ou contornados guards para conferir a interface.

Após login ADMIN feito pelo usuário, a tela de e-mail foi conferida com backend real em 1440px e 360px, no modo escuro. Mostrou a programação geral, faculdade, ônibus/motorista, texto exato do e-mail e itinerário/pontos. O backend retornou integração desativada, SMTP/remetente/lista de teste ausentes, zero destinatários elegíveis e histórico vazio; envio/correção/ativação permaneceram bloqueados. Avisos de configuração foram compactados em um painel separado, e os botões de fechar dos diálogos receberam nomes acessíveis; fechamento do itinerário por Escape foi conferido. Documento sem overflow: clientWidth/scrollWidth 1440/1440 no desktop e 360/360 no celular; main 1369/1369 e 289/289. Diálogo da prévia em 360px teve 340/340, com texto quebrado sem rolagem horizontal. Console de erros vazio na conferência. Não houve envio, correção, ativação automática ou alteração de credenciais. Modo claro, estados de SMTP e entrega real ainda requerem homologação; demais fluxos da tela estão cobertos por testes HTTP automatizados.

Os resultados abaixo são o registro histórico dos dashboards, não a contagem atual da branch de e-mail.

Em 10/10/2026 foram validados após a implementação dos dashboards:

| Verificação | Resultado |
|---|---|
| TypeScript da aplicação | Aprovado |
| TypeScript dos testes | Aprovado |
| Karma + Chrome Headless | **209/209 aprovados** |
| Build Angular de produção | Aprovado |
| Bundle inicial | `1,09 MB` bruto; `194,47 kB` estimados para transferência |
| Comparação antes/depois | 144 antes dos dashboards; 196 antes do redesign; 206 após o redesign dos cards; 209 após os diálogos, em 50 arquivos de spec |

Foram executados `tsc --noEmit` para aplicação e testes, Karma/Chrome Headless e build Angular de produção. O redesign acrescentou testes de cards/detalhes, seleção por ID/data e preservação após recriação, limite de pontos, ausência de repetição, avisos, alternância de pendências e tabela expansível. O build final passou sem avisos. O dashboard vazio foi substituído por testes de comportamento; os testes existentes de pagamento foram adaptados ao componente compartilhado, preservando sua cobertura. `git diff --check` também foi aprovado.

Durante a instalação, o npm informou 17 alertas na árvore de dependências (2 baixos, 2 moderados e 13 altos). Nenhum `npm audit fix` foi aplicado automaticamente, pois a atualização deve ser analisada separadamente para evitar alterações incompatíveis.

A cobertura adicionada contempla:

- login, armazenamento, restauração inválida/inativa, sessão expirada, temporizador, logout e papéis;
- interceptor para API, login sem token, `401`, `403` e status `0`;
- guards para visitante e cada papel;
- login inválido, backend indisponível e redirecionamento pós-login;
- criação, edição de e-mail, redefinição de senha, status e exclusão no serviço de usuários;
- bloqueio visual da própria conta, confirmações, recarga das listas e logout após alteração própria;
- tratamento de `400`, `404` e `409` na administração de usuários;
- `GET /viagem/minhas` sem identificação do motorista;
- cadastro e edição de aluno com validação e envio da mensalidade;
- `GET /contareceber/minhas` sem identificação do aluno;
- `GET /contareceber/listar` para a consulta administrativa;
- pagamento com corpo `null` e somente a forma de pagamento;
- consulta de recibo, estados da nova tela e bloqueio de clique duplicado;
- comportamentos `400` e `409` no pagamento e menu exclusivo do aluno;
- separação das contas administrativas, estados de carregamento/erro/vazio e menu exclusivo do ADMIN;
- correção dos imports quebrados dos specs de faculdade e ponto;
- atualização do teste obsoleto do componente raiz.

Para manutenção, foram adicionados testes dos seis endpoints, filtros e payloads sem autoria/campos extras; textos e limites; envio duplicado; resolução/reabertura; observação preservada/limpa; alteração explícita de ônibus; erros e permanência de formulários; menus/guards por papel; atalho; seleção `OPERANDO`; preservação de IDs/faculdades e cancelamento de grade. Também há testes de texto seguro, UTC e exclusões individuais protegidas.

Para dashboards, há testes dos três endpoints sem identidade, mês opcional, apenas um componente/consulta por papel, rota e menu Início, agenda sem duplicação, ônibus indisponível, pontos ordenados, múltiplas faculdades, programação indefinida, rotas sem viagem, mensalidade/cobrança distintas, nulos, estados de erro/vazio, prazos, moeda, São Paulo, cancelamento de GET e recuperação após falha. O pagamento compartilhado possui testes de envio único, fechamento bloqueado, 400/404/409/status 0, revisão manual de resposta incerta e recibo preservado após falha de atualização.

O compilador Angular teve bloqueio de leitura de diretórios pela sandbox Windows. Build e Karma foram executados com autorização fora da sandbox. Nenhum framework/dependência adicional foi instalado. Na entrega de manutenção de 08/10/2026, uma consulta sem credenciais confirmou conexão recusada em `localhost:8080`; a reorganização não realizou testes integrados novos. Os testes automatizados não equivalem à homologação com dados reais.

Na entrega do dashboard, o backend respondeu **401** à consulta sem autenticação em `/dashboard/aluno`. No navegador, `/inicio` sem sessão redirecionou para `/login?retorno=%2Finicio`, sem sidebar. Após login feito pelo usuário, ADMIN foi validado com dados reais: seleção de mês alterou movimentações/série e preservou posição atual; as contas a receber corresponderam à listagem; o atalho de manutenção abriu o filtro de ônibus corretamente. Layout conferido em 1440px e 360px, no modo escuro disponível, sem overflow horizontal do documento e sem erros/avisos de console na conferência. As tabelas têm rolagem interna e os links multilinha receberam área clicável contínua. A sessão continuou disponível ao navegar e recarregar. A conferência adicional do ALUNO/MOTORISTA está registrada abaixo. Modo claro e pagamento integrado permanecem pendentes. Não foram geradas credenciais ou alterados dados financeiros para simular homologação.

No redesign, o ADMIN foi novamente conferido em 1440px/360px no modo escuro com dados reais: cards, diálogo da frota, fechamento por Escape, pendências Receber/Pagar e tabela expansível. Medição em 360px confirmou documento sem overflow e main com clientWidth/scrollWidth de 289px. ALUNO e MOTORISTA foram conferidos após o usuário fazer login, em 1440px/360px no modo escuro: cards, programação, destinos completos, troca de ônibus/ocorrência e aviso de indisponibilidade. Atualizar preservou a viagem e o valor exibido no seletor, corrigido após a conferência real; o teste agora verifica também o select nativo após recriação. Nos dois perfis não houve overflow do documento nem do main. O aluno consultado não tinha cobrança principal: validado o estado vazio, sem pagamento real. Modo claro, pagamento integrado e demais cenários de homologação permanecem pendentes; os testes automatizados não substituem essas verificações.

Após a melhoria dos diálogos, o transporte do MOTORISTA foi conferido com dados reais no modo escuro, no computador e no celular: destaque legível, campos separados, conteúdo sem overflow horizontal e fechamento pelo botão do rodapé. Os novos resumos do ALUNO e ADMIN foram validados por testes automatizados; a conferência visual desses dois diálogos com dados reais e o modo claro permanecem pendentes. Os três testes adicionais verificam itinerário/destinos completos, fechamento, valores zero, cadastro e acesso aos módulos, sem alterar o componente de pagamento.

Os specs legados de componentes continuam majoritariamente como testes básicos de criação. Ampliar a cobertura de cada CRUD, validação e payload continua recomendado.

---

## 12. Validação integrada recomendada

Com o backend real ativo:

1. entrar como administrador e conferir todos os menus e CRUDs;
2. criar um aluno e um motorista de teste;
3. em `/usuarios`, criar as contas vinculadas;
4. entrar com cada conta e validar os três menus;
5. confirmar leitura de rotas, pontos e grades pelo aluno, sem ações de escrita nesses módulos;
6. cadastrar ou editar o aluno com uma mensalidade válida e confirmar a primeira cobrança com vencimento em 30 dias;
7. como ADMIN, abrir `/contas-receber` e conferir todas as mensalidades sem ações de pagamento;
8. como aluno, abrir `/minhas-matriculas`, pagar uma cobrança e consultar o recibo;
9. confirmar que o navegador não envia aluno, pessoa ou valor e que um segundo pagamento recebe `409`;
10. confirmar em `/auth/me` que o pagamento altera `statusMatricula` para `ATIV0`;
11. validar, em teste controlado, que o backend cria somente uma nova cobrança mensal no vencimento;
12. confirmar que motorista acessa perfil, próprias viagens e próprios chamados;
13. recarregar a página e validar a restauração da sessão;
14. testar logout, token expirado, URL proibida e token inválido;
15. editar o e-mail e redefinir a senha de uma conta e confirmar que o token anterior recebe `401`;
16. desativar uma conta, confirmar login bloqueado, reativar e realizar novo login;
17. confirmar o bloqueio visual da própria conta e o `409` do último administrador ativo;
18. excluir um acesso e confirmar que a pessoa preservada volta a `pessoas-sem-usuario`;
19. testar conflitos de e-mail/pessoa (`409`);
20. pausar o backend com segurança e validar o status `0`.

Para a manutenção, entrar com ALUNO/MOTORISTA, abrir chamados sem informar nome e confirmar isolamento por autoria. Como ADMIN, conferir filtros, autoria e resposta; resolver/reabrir sem marcar o ônibus deve preservar seu estado. Ao marcar, verificar a mudança no cadastro. Testar novas viagens apenas com `OPERANDO`, preservação de vínculos existentes e `409` em mudança de disponibilidade/exclusões protegidas. A homologação desses passos ainda está pendente.

Excluir acesso remove apenas `Usuario`. O registro de `Pessoa` criado nos testes permanece no banco e pode receber uma nova conta posteriormente.

---

## 13. Implantação e segurança

A URL de produção ainda não foi fornecida; por isso `environment.apiUrl` permanece em `http://localhost:8080`. Antes da implantação, deve ser criada a configuração de ambiente adequada.

O servidor de produção precisa:

- usar HTTPS;
- permitir apenas as origens CORS necessárias;
- servir o bundle gerado;
- redirecionar URLs da SPA para `index.html`;
- manter validação e autorização no backend;
- proteger e rotacionar a chave de assinatura JWT conforme a política do backend.

Exemplo de fallback SPA no Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 14. Situação atual

| Item | Situação |
|---|---|
| Angular standalone e lazy loading | Implementado |
| Pastas por entidade | Services, models, componentes e testes reorganizados e validados |
| API centralizada por environment | Implementado para desenvolvimento |
| Autenticação JWT e expiração automática | Implementado |
| Interceptor e guards | Implementado |
| Menus por papel | Implementado |
| Perfil, usuários e minhas viagens | Implementado |
| Administração segura de acessos | E-mail, senha, status e exclusão implementados |
| CRUDs administrativos existentes | Mantidos para `ADMIN` |
| Arquivamento de alunos | Frontend implementado; filtros, lote real, restauração e exclusão protegida dependem das novas APIs do backend |
| Leitura de rotas, pontos e grades | Disponível para `ALUNO` |
| Pagamento de matrícula | Implementado para `ALUNO` com conta, recebimento e recibo |
| Consulta de contas a receber | Implementada para `ADMIN` em modo somente leitura |
| Chamados de manutenção | Abertura/acompanhamento para ALUNO/MOTORISTA e atendimento para ADMIN |
| Estado operacional do ônibus | Alteração explícita no atendimento; sem liberação/cancelamento automático |
| Compatibilidade de grades | Novas viagens somente OPERANDO; vínculos/IDs existentes preservados |
| Início por papel | Implementado em `/inicio`, preservando `/perfil` |
| Transporte no dashboard | Cards por ocorrência, seletor, programação compacta e detalhes completos |
| Financeiro no dashboard | Cobrança do ALUNO e movimentações/posição atual do ADMIN |
| Pagamento compartilhado | Mesmo componente de confirmação/recibo no início e em Minhas matrículas |
| Programação geral por e-mail | Tela ADMIN em `/programacao-email`, cards por faculdade, envio/correção, automático e histórico |
| Envio SMTP real | Pendente de configuração externa e homologação; nenhuma entrega real afirmada |
| Geração mensal da cobrança | Responsabilidade do backend; validação integrada pendente |
| Testes automatizados | 351 aprovados, em 55 specs |
| Build de produção | Aprovado |
| Teste integrado dos três papéis | Dashboards conferidos com login real; demais fluxos completos ainda pendentes |
| Dashboards com backend real | Três perfis conferidos em desktop/360px no modo escuro; ADMIN inclui mês, posição atual e atalhos |
| Importação e exclusão em massa persistente | Não implementadas |
| Ambiente de produção | URL ainda não definida |

---

**Última revisão:** 14 de outubro de 2026

**Versão do pacote:** 0.0.0

**Status:** autenticação, matrícula, manutenção, dashboards e administração da programação geral por e-mail implementados. Três dashboards e tela ADMIN de e-mail conferidos com dados reais em modo escuro. SMTP real, pagamento integrado, modo claro e demais fluxos de homologação ainda pendentes. Backend/guia/diagrama preservados; WhatsApp permanece em branch separada.
