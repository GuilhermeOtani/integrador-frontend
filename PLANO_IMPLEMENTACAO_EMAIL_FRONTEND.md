# Plano de implementação frontend — programação geral por e-mail

## 1. Status, referência e isolamento da entrega

Documento elaborado e implementação frontend concluída em 14/10/2026, na branch `codex/integracao-email`. **A interface está implementada; configuração SMTP e homologação de entrega real permanecem pendentes.**

Referência principal: `GUIA_EMAIL_FRONTEND.md`, recebido do backend. Foram conferidos também `EmailDto`, `EmailAdminController`, `EmailLoteService`, `ProgramacaoEmailService` e `EmailMensagemService`, em leitura, para confirmar contratos e limites. Os exemplos do guia orientam a integração; a implementação Angular seguirá o padrão real deste projeto, sem copiar comportamentos simplificados que prejudiquem erros, acessibilidade ou segurança.

- Nova branch frontend: `codex/integracao-email`.
- Base: principal real do repositório, chamada `master`, no commit `437170a74abb6b888c76cb09ffc8f1394002a870`. A referência foi conferida no GitHub e coincide com a base local.
- A branch `codex/integracao-whatsapp`, já enviada ao GitHub, permanece preservada. Não será mesclada nem apagada.
- A nova branch não contém telas, menu, serviços ou documentação de implementação do WhatsApp.
- O backend informa usar a branch `codex/integracao-email`; sua troca/inicialização será feita separadamente, sem alterar o backend nesta entrega frontend.
- Backend, guia recebido e diagrama de classes não serão modificados.

O documento registra o desenho adotado e os critérios de homologação. O resultado executado está ao final; testes HTTP/Angular não representam comprovação de envio SMTP.

## 2. Objetivo e regras de negócio confirmadas

O administrador poderá consultar a programação geral de hoje, solicitar envio por e-mail e controlar o automático às **15h, em `America/Sao_Paulo`**.

Todos os destinatários elegíveis recebem **o mesmo conteúdo geral**, organizado por faculdade. O aluno procura sua faculdade e encontra principalmente o **número de identificação do ônibus** e o **nome do motorista**. Isso substitui a proposta anterior de PDF individual por WhatsApp.

### Quem recebe

“Todos os associados” significa, no contrato atual do backend:

- ALUNO e MOTORISTA com **conta de acesso ativa**.
- E-mail obtido de `Usuario.email`, o mesmo endereço utilizado no login.
- ADMIN não recebe essa mensagem.
- Pessoas cadastradas sem `Usuario` não possuem endereço disponível para este envio.
- Não há filtro por faculdade do aluno, status da matrícula ou motorista específico.
- Em modo de teste, somente os endereços permitidos pelo servidor participam da seleção.
- A seleção normaliza e deduplica os endereços no backend.

O Angular não fará consulta de usuários para construir uma lista de destinatários, nem receberá um campo livre para adicionar endereços. A prévia retorna contagens; os detalhes do lote retornam os endereços efetivamente registrados, apenas ao ADMIN.

### Mensagem e privacidade

- Cada envio possui um único destinatário visível. Não haverá lista coletiva em `To` ou `Cc`.
- Corpo HTML e alternativa em texto simples, gerados exclusivamente pelo backend.
- Sem PDF, anexo, link público de documento ou editor de assunto/HTML.
- Agrupamento por faculdade; uma viagem com várias faculdades aparece nas seções correspondentes, sem criar e-mails extras por faculdade.
- Número do ônibus e motorista destacados; rota, itinerário, grade, pontos e avisos complementam a consulta.
- Não exibir CPF, CNH, salário, cobrança, mensalidade ou lista de alunos no conteúdo.
- Não inventar horários, previsão de chegada, rastreamento ou associação individual aluno–ônnibus.
- Ônibus indisponível continua visível com aviso. Não será apresentado como viagem automaticamente cancelada.

### Programação e recorrência

- A seleção do dia é responsabilidade do backend, considerando todas as grades correspondentes ao dia da semana.
- Segunda utiliza SEGUNDA, terça utiliza TERCA, e assim por diante; a data antiga de `Viagem` não define a ocorrência enviada.
- Viagens sem grade não serão tratadas como escala confirmada de hoje.
- Sem programação, nenhum e-mail será enfileirado. Não criar conteúdo fictício para preencher a interface.
- Envio normal evita repetição diária para o mesmo endereço; envio manual anterior também participa dessa proteção no automático.
- Correção exige ação distinta de reenvio, confirmação explícita e motivo.
- Não existe endpoint de inscrição/cancelamento pessoal de e-mail no guia. Não criar card de aceite no perfil, preferência local ou promessa de descadastro sem suporte do backend.

## 3. Escopo e organização do Angular

Usar Angular standalone, PrimeNG, signals, formulários reativos e RxJS já presentes. Não adicionar dependências, aliases globais ou uma pasta global de serviços.

Estrutura implementada:

```text
src/app/components/email-programacao/
├── models/
│   └── email-programacao.models.ts
├── service/
│   ├── email-programacao-service.ts
│   └── email-programacao-service.spec.ts
├── components/
│   └── email-programacao/
│       ├── email-programacao.ts
│       ├── email-programacao.html
│       ├── email-programacao.css
│       └── email-programacao.spec.ts
├── utils/
│   ├── email-programacao.utils.ts
│   ├── email-programacao.utils.spec.ts
│   ├── consulta-email.ts
│   ├── solicitacao-pendente.ts
│   └── solicitacao-pendente.spec.ts
└── testing/
    └── email-programacao.fixtures.ts
```

Usar `.css`, acompanhando as telas existentes, em vez de introduzir uma convenção SCSS apenas para este módulo. Os testes ficam ao lado dos arquivos testados; `testing/` contém somente fixtures reutilizáveis. Não criar pastas vazias.

Reutilizar os caminhos reais:

- `src/environments/environment.ts`: `apiUrl`.
- `src/app/core/auth/service/auth.service.ts`: identidade atual, sem criar sessão nova.
- `src/app/core/auth/guards/auth.guards.ts`: `authGuard` e `roleGuard`.
- `src/app/core/auth/interceptors/auth.interceptor.ts`: JWT e tratamento global.
- `src/app/core/auth/utils/api-error.ts`: `mensagemApi` e `problemaApi`.
- `src/app/components/dashboard/models/dashboard.models.ts`: `ViagemResumo` e tipos associados.
- `src/app/components/sidebar/components/sidebar/sidebar.ts`: item de menu.
- `src/app/components/grade-diaria/components/grade-diaria-listar/`: eventual atalho administrativo.
- `src/styles.css` e componentes atuais: tema claro/escuro, cards, botões, tabelas e diálogos.

Não alterar login, dashboards, finanças ou cadastros para substituir seus fluxos. A funcionalidade será adicional e exclusivamente administrativa.

## 4. Contratos públicos

Os tipos abaixo serão criados em `models/email-programacao.models.ts`. Não duplicar os DTOs de transporte: o backend de e-mail usa o mesmo `ViagemResumo` do dashboard. Seu tipo atual aceita `dataOcorrencia` e campos de grade nulos; conservar essa tolerância, mesmo que a programação diária costume retorná-los preenchidos.

```ts
import { ViagemResumo } from '../../dashboard/models/dashboard.models';

export type EstadoEntrega =
  | 'PENDENTE' | 'PROCESSANDO' | 'ACEITA_SMTP'
  | 'FALHA' | 'INCERTA' | 'SUPRIMIDA' | 'EXPIRADA';

export interface ConteudoEmail {
  assunto: string;
  texto: string;
  html: string;
}

export interface ConfiguracaoEmail {
  habilitado: boolean;
  automatico: boolean;
  modoTeste: boolean;
  disponivel: boolean;
  horario: string;
  fuso: string;
  impedimentos: string[];
}

export interface PreviaEmail {
  dataReferencia: string;
  geradoEm: string;
  destinatariosElegiveis: number;
  destinatariosIgnorados: number;
  viagens: ViagemResumo[];
  avisos: string[];
  mensagem: ConteudoEmail;
}

export interface EnvioEmailRequest {
  requestId: string;
  reenviar: boolean;
  motivo?: string;
}

export interface EntregaEmail {
  id: string;
  usuarioId: number;
  email: string;
  revisao: number;
  estado: EstadoEntrega;
  tentativas: number;
  erro: string | null;
  aceitoEm: string | null;
}

export interface LoteEmail {
  id: string;
  dataReferencia: string;
  origem: 'MANUAL' | 'AUTOMATICA';
  reenvio: boolean;
  motivo: string | null;
  criadoEm: string;
  ignorados: number;
  totais: Record<EstadoEntrega, number>;
  entregas: EntregaEmail[];
  mensagem: ConteudoEmail | null;
}

export interface HistoricoEmail {
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  itens: LoteEmail[];
}
```

Observações obrigatórias:

- Requisição usa `reenviar`; resposta usa `reenvio`.
- Histórico usa `totalElementos`, não `total`.
- Histórico retorna `entregas: []` e `mensagem: null` por desenho do contrato; não interpretar como perda de conteúdo.
- Buscar o detalhe para obter entregas e mensagem congelada.
- `usuarioId` identifica historicamente o destinatário e não será enviado pelo Angular no POST. Não assumir que a conta ainda existe ao abrir um lote antigo.
- `revisao` começa em zero. Não alterar contagens ou estados recebidos.
- `disponivel` comprova apenas configuração mínima reconhecida pelo backend, não conexão SMTP válida nem garantia de entrega.

## 5. Serviço HTTP e autorização

Criar `EmailProgramacaoService`, com base `${environment.apiUrl.replace(/\/$/, '')}/integracoes/email` e retorno tipado por `Observable`.

| Método do serviço | HTTP | Corpo/parâmetros | Resposta |
|---|---|---|---|
| `configuracao()` | GET `/configuracao` | nenhum | `ConfiguracaoEmail` |
| `configurar(automatico)` | PUT `/configuracao` | `{ automatico }` | `ConfiguracaoEmail` |
| `previa()` | GET `/previa` | nenhum | `PreviaEmail` |
| `enviar(request)` | POST `/envios` | `EnvioEmailRequest` | `LoteEmail`, HTTP 202 |
| `historico(pagina, tamanho)` | GET `/envios` | `pagina`, `tamanho` | `HistoricoEmail` |
| `detalhe(id)` | GET `/envios/{id}` | UUID codificado no caminho | `LoteEmail` |

Todos os endpoints exigem ADMIN. Não montar `Authorization` manualmente nem chamar SMTP/Meta no navegador.

Não enviar destinatários, usuário, faculdade, público, data arbitrária, assunto, texto, HTML, anexos ou credenciais no POST. O envio normal contém apenas `requestId` e `reenviar: false`; omitir `motivo`. A correção contém `reenviar: true` e motivo normalizado com `trim()`.

Rota proposta, antes do curinga em `src/app/app.routes.ts`:

```ts
{
  path: 'programacao-email',
  loadComponent: () =>
    import('./components/email-programacao/components/email-programacao/email-programacao')
      .then(m => m.EmailProgramacao),
  canActivate: [authGuard, roleGuard(['ADMIN'])],
}
```

Menu ADMIN, seção Logística: **Programação por e-mail**, ícone `pi pi-envelope`, rota `/programacao-email`. Não incluir nos menus ALUNO/MOTORISTA. Não alterar os destinos de login ou da raiz.

Em Grades, acrescentar atalho ADMIN **Enviar programação de hoje**, que apenas abre `/programacao-email`. Não iniciar POST por navegação, query string, abertura de página ou mudança de filtro.

## 6. Tela administrativa e apresentação

### 6.1 Cabeçalho e cards objetivos

Título **Programação por e-mail**, subtítulo **Escala geral de hoje para alunos e motoristas com conta ativa**, botão Atualizar.

No topo, cards compactos para:

1. **Integração:** habilitada/desativada, disponível/indisponível, teste/produção, impedimentos retornados.
2. **Automático:** situação, horário e fuso retornados; ativar/desativar com carregamento.
3. **Programação:** dia e quantidade de viagens.
4. **Público:** destinatários elegíveis e ignorados na seleção, explicitando que a duplicidade diária é calculada no lote.

Não mostrar campos para token, senha SMTP, host ou edição de destinatários. Impedimentos orientarão a configuração no servidor, sem tentar corrigir credenciais pelo frontend.

No desktop, distribuir cards usando grid sem alturas artificiais. No celular, uma coluna, priorizando programação, ônibus/motoristas e avisos. Reutilizar tema e cores do projeto; contraste não dependerá apenas de cor.

### 6.2 Programação geral por faculdade

Apresentar a programação em seções/cards por faculdade, com pesquisa local por faculdade, rota, identificação do ônibus ou motorista. A pesquisa filtra apenas a consulta visual: **não altera o conteúdo nem os destinatários do envio**.

Em cada viagem, destacar:

- **Ônibus:** `numeroIdentificacao` em destaque; nunca substituir pelo ID interno sem identificação clara.
- **Motorista:** nome em destaque.
- Rota e data da ocorrência, grade, itinerário e pontos na ordem recebida.
- Estado do veículo e avisos de indisponibilidade sempre visíveis, inclusive no celular.
- Outros dados, como placa/modelo/capacidade/endereços, podem ficar em detalhes para evitar cards extensos.

Uma viagem com vários destinos aparecerá nas respectivas seções. A quantidade total de viagens continuará vindo de `previa.viagens.length`, e não da soma das linhas repetidas nos grupos. Para destinos ausentes, usar **Destino não informado**; para nomes/ônibus/motoristas ausentes, usar um texto explicativo, sem inventar valores.

O backend agrupa a mensagem por nome da faculdade e faz a geração final. O agrupamento visual não será usado para gerar outro corpo de envio; o administrador poderá conferir o texto exato retornado em **Ver mensagem do e-mail**.

### 6.3 Prévia exata do conteúdo

Diálogo responsivo com assunto e `mensagem.texto`, exibido por interpolação e `white-space: pre-wrap`. Informar que o e-mail também contém a versão HTML gerada pelo servidor.

Não usar `bypassSecurityTrustHtml`, `document.write`, scripts ou iframe sem isolamento. A primeira versão não precisará renderizar o HTML bruto: cards mostram a programação e texto mostra o conteúdo completo. Não permitir editar a mensagem no diálogo.

### 6.4 Estados de consulta

Configuração, prévia, histórico e detalhe terão carregamento/erro próprios. Uma falha de histórico não ocultará a programação já consultada.

- Sem viagens: explicar **Não há programação para hoje. Nenhum e-mail será enviado**.
- Sem destinatários: mostrar o motivo e bloquear envio, mesmo que existam viagens.
- Sem histórico: estado vazio somente após GET bem-sucedido.
- Falha HTTP: estado de erro com atualização manual, nunca contagens artificialmente zeradas.
- Dados anteriores podem permanecer em uma atualização com falha, mas serão identificados como **desatualizados**; bloquear envio com configuração/prévia desatualizadas até nova consulta bem-sucedida.
- Ao trocar a página do histórico ou o lote selecionado, cancelar consultas anteriores para não aplicar uma resposta fora de ordem.
- No momento de confirmar envio, usar a prévia válida mais recente. A API continua decidindo a programação real; a prévia não reserva conteúdo nem destinatários.

## 7. Envio manual, correção e idempotência

### 7.1 Confirmação

**Enviar programação de hoje** abre diálogo PrimeNG com data da prévia, quantidade de viagens, contagem elegível, modo de teste e aviso de que todos recebem a escala geral. Não usar `window.confirm()` para esse fluxo.

Bloquear abertura/confirmação quando houver: consulta necessária em andamento, dados desatualizados, configuração indisponível, zero viagens, zero elegíveis, envio/configuração em andamento ou uma intenção anterior sem resolução.

Somente ao confirmar uma nova intenção gerar `crypto.randomUUID()`. Bloquear cliques duplicados, edição do corpo e fechamento durante o POST. Não disparar envio em construtor, `ngOnInit`, timer ou restauração de sessão.

Após HTTP 202, mostrar **Lote registrado para processamento**, abrir o detalhe pelo ID retornado e atualizar histórico/prévia. O diálogo do lote deve permanecer acessível mesmo se a atualização das listas falhar.

### 7.2 Correção

**Reenviar correção** será ação separada, com formulário reativo:

- Motivo obrigatório, não composto apenas por espaços, até 500 caracteres.
- Contador e validação associada ao campo.
- Aviso **Outra mensagem poderá ser enviada a quem já recebeu hoje; a anterior não será apagada**.
- Confirmação explícita, sem seleção de endereços ou edição livre de conteúdo.

Preservar motivo em erros. Nova correção recebe novo UUID somente depois de resolver eventual solicitação anterior. Não tratar falha SMTP como autorização automática para criar uma correção.

### 7.3 Persistência e recuperação de resultado incerto

Criar utilitário de persistência isolado, com chave `integrador.email.request.<adminId>`, separada da chave da autenticação.

Guardar apenas um envelope validado contendo versão do formato, administrador, data de referência da prévia, instante de criação e **o corpo exato da intenção**. Não guardar JWT adicional, credenciais, mensagem completa, lista de destinatários ou dados SMTP. O motivo pode conter informações digitadas pelo ADMIN; não copiá-lo para logs/analytics.

Antes do POST, persistir a intenção em `sessionStorage`. Tratar armazenamento indisponível sem travar a tela: manter em memória e avisar que recarregar perderá a recuperação local. Não prometer persistência quando `setItem` falhar.

Na restauração:

- Validar JSON, UUID, administrador, tipos, data e motivo compatível com `reenviar`.
- Não restaurar uma operação de outro usuário.
- Não executar POST automaticamente.
- Oferecer **Consultar solicitação** usando `GET /envios/{requestId}`; o backend usa o UUID da requisição como ID do lote.
- Se localizar o lote, mostrar seu resultado/conteúdo e remover a intenção local pendente.
- Se ocorrer 404, não assumir que um POST concorrente jamais poderá concluir. Oferecer atualização e tentativa manual com o mesmo UUID/corpo, quando a intenção ainda for do dia atual e houver disponibilidade.
- Falha de rede, timeout/408 ou 5xx: preservar o UUID e corpo, consultar detalhe/histórico e nunca usar `retry()` automático no POST.
- Depois de atualizar cadastros/grades, não trocar silenciosamente o corpo da intenção pendente. Mesmo UUID com outros parâmetros retorna 409.
- Após a virada do dia em São Paulo, consultar o lote antigo, mas não reenviar automaticamente ou por um botão genérico a intenção de ontem: um ID não encontrado poderia criar um envio da programação de hoje. Exigir resolução explícita antes de uma nova intenção.
- Em 401/403, respeitar o interceptor e não reenviar com outra identidade. O registro isolado pelo ADMIN não poderá aparecer para outra conta.

Em rejeições claras de validação, permitir revisar o formulário. Conflito de UUID exige primeiro conferir o lote existente; não abandonar o identificador e gerar outro como tentativa de contornar o conflito.

## 8. Automático, histórico e detalhes

### Automático

- PUT envia somente `{ automatico: boolean }`.
- Mostrar horário/fuso do contrato, com a recuperação até antes das 18h descrita como regra do backend, não como campo inexistente da configuração.
- Ativação exige `config.disponivel`; disponibilidade não depende de uma tentativa prévia de envio ter sucesso.
- Desativação continua permitida mesmo quando SMTP estiver indisponível.
- Não atualizar a chave otimisticamente; usar o resultado do PUT e preservar a situação anterior em erro.
- Confirmar ativação informando o público e o horário. A homologação real deve ocorrer primeiro com automático desativado.
- Desativar impede novos lotes automáticos, mas não cancela mensagens já enfileiradas/aceitas.
- O Angular não agenda envios. Navegador fechado não impede a rotina; backend desligado não executa nem envia.

### Histórico

- Paginação do servidor, inicial `pagina=0`, `tamanho=20`, opções 20/50/100.
- Usar `totalElementos` e `totalPaginas`; ao trocar tamanho, voltar à página zero.
- Não oferecer ordenação local como se abrangesse todos os registros. Preservar a ordem retornada.
- Colunas: dia, criação, origem manual/automática, envio normal/correção, totais dos estados, ignorados e Detalhes.
- Não presumir que `ignorados` contém apenas duplicidade diária: o lote também incorpora ignorados na seleção inicial. A prévia e o lote podem ter contagens distintas.

### Detalhe do lote

Diálogo com cabeçalho compacto (dia/origem), cards de totais e aviso sobre aceite SMTP. Exibir motivo da correção, ID do lote, tabela paginada local de entregas, endereço, estado, revisão, tentativas, erro seguro e instante do aceite quando disponível.

Mostrar a **mensagem congelada do lote**, nunca substituir por `previa.mensagem` de uma consulta atual. Cadastro/grade alterados após o lote não modificam o conteúdo já registrado.

Atualização manual sempre disponível. Adicionar polling GET a cada cinco segundos apenas enquanto o detalhe estiver aberto e houver PENDENTE/PROCESSANDO, limitado a dez minutos. Não sobrepor GETs: usar `exhaustMap` ou controle equivalente. Encerrar ao fechar, sair, destruir o componente, ocorrer erro ou terminar o processamento. Polling não repetirá POST, não alterará estados e não manterá atualização global eterna.

| Estado recebido | Rótulo e interpretação |
|---|---|
| PENDENTE | Na fila |
| PROCESSANDO | Processando |
| ACEITA_SMTP | Aceito pelo servidor de e-mail — entrega não confirmada |
| FALHA | Falha conhecida |
| INCERTA | Pode ter sido enviado; conferir antes de reenviar |
| SUPRIMIDA | Não enviado por alteração/inativação do cadastro |
| EXPIRADA | Janela de envio encerrada |

Não adicionar ENTREGUE/LIDA, rastreamento de abertura, webhook de entrega ou garantia de caixa de entrada. Após aceite SMTP ainda pode haver spam/rejeição posterior.

O backend controla reserva da fila, supressão após mudança de e-mail/conta, até quatro tentativas totais para falhas comprovadamente anteriores ao envio, intervalos de 1/5/15 minutos e resultado incerto. A tela somente apresenta esses resultados. Automáticos pendentes expiram às 18h; manuais, na virada do dia de São Paulo.

## 9. Erros, datas e segurança

| Situação | Comportamento frontend |
|---|---|
| 400 | Preservar formulário, apresentar `detail`, associar `ProblemDetail.errors` aos controles; revisar motivo/paginação |
| 401 | Deixar o interceptor encerrar sessão e navegar ao login |
| 403 | Deixar o interceptor navegar à tela Sem permissão |
| 404 | No detalhe, informar lote não localizado; atualizar histórico, sem trocar por outro lote nem fabricar resultado |
| 409 | Mostrar conflito retornado; atualizar prévia/histórico e preservar dados; resolver UUID antes de nova intenção |
| 503 | Mostrar integração desativada/incompleta; não inserir campos de credenciais na tela. Para POST, recuperar pelo mesmo UUID antes de tratar como nova intenção |
| Status 0, timeout/408 ou 5xx | Distinguir falha de consulta de resultado incerto de POST; preservar intenção e orientar verificação antes de repetição manual |

Reutilizar `mensagemApi`/`problemaApi` e feedback atual. Não gerar toast duplicado para 401/403/status 0; o aviso local de resultado incerto pode explicar a preservação da solicitação sem repetir a notificação global.

Datas civis (`dataReferencia`, `dataOcorrencia`) serão exibidas em `dd/MM/yyyy` por separação validada dos componentes ou `DatePipe` com UTC explícito. Não converter para horário local e deslocar o dia. `geradoEm`, `criadoEm` e `aceitoEm` serão formatados em `America/Sao_Paulo`.

Não usar o relógio do computador para escolher quais viagens enviar. A data da prévia/lote vem do backend. Valores nulos recebem indicação de ausência, e zero não será tratado como nulo.

Descrições, motivos, avisos, nomes e conteúdo textual serão exibidos por interpolação. As credenciais ficam no servidor. Não colocar e-mails destinatários em URLs, query strings ou storage da feature; eles aparecem somente nos detalhes administrativos recebidos pela API.

Diálogos terão título, labels, foco inicial adequado, fechamento por teclado quando seguro e retorno do foco ao botão de origem. Bloquear fechamento somente durante operações de escrita em andamento; consultas com erro devem permitir voltar. Tabelas largas terão rolagem dentro do card, não da página inteira.

## 10. Preparação do backend e homologação real

Esta seção registra pré-requisitos externos, não alterações a realizar pelo Angular:

1. Reiniciar o backend na branch de e-mail e conferir aplicação da migration V7. Não continuar com o processo antigo do WhatsApp.
2. Preservar V6/histórico Flyway e tabelas antigas sem uso; não executar reparos, apagar tabelas ou ajustar checksums como parte do frontend.
3. Escolher SMTP e seguir requisitos atuais do provedor, remetente autorizado e SPF/DKIM/DMARC quando aplicáveis.
4. Configurar credenciais somente no processo Java/IntelliJ, nunca no Angular, no Git ou no chat.
5. Começar com `EMAIL_PRODUCTION=false`, automático desativado e contas controladas em `EMAIL_TEST_RECIPIENTS`.
6. Consultar configuração/prévia. Elas funcionam sem SMTP pronto; envio/habilitação do automático exigem disponibilidade.
7. Fazer envio manual autorizado e verificar estado SMTP e recebimento real na caixa de entrada/spam.
8. Ativar público completo/automático somente após homologação e autorização explícita.

| Variável externa | Papel |
|---|---|
| `EMAIL_ENABLED` | Habilita integração/processamento no servidor |
| `EMAIL_SCHEDULERS_ENABLED` | Habilita rotina e fila; deve estar true para processar os envios reais, inclusive manuais |
| `EMAIL_PRODUCTION` | false limita à lista permitida; true seleciona associados ativos elegíveis |
| `EMAIL_TEST_RECIPIENTS` | Endereços de contas ativas permitidas no teste |
| `EMAIL_FROM` | Remetente autorizado |
| `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT` | Servidor/porta informados pelo provedor |
| `EMAIL_SMTP_USERNAME`, `EMAIL_SMTP_PASSWORD` | Credenciais próprias para envio |
| `EMAIL_STARTTLS`, `EMAIL_SSL` | Exatamente uma modalidade TLS, conforme o provedor |

Não pressupor SMTP gratuito, senha comum aceita, domínio já verificado ou ausência de limites. Disponibilidade estrutural não comprova autenticação. Não enviar e-mail de teste automaticamente ao iniciar a aplicação.

Não haverá configuração de Meta, telefone, PDF ou túnel HTTPS para receber webhooks neste fluxo básico de SMTP. O backend local pode enviar com acesso de saída ao provedor; deve permanecer ligado para o automático.

## 11. Sequência de implementação e homologação

1. Registrar baseline de testes na branch base e conferir funcionamento atual sem a feature.
2. Criar contratos e serviço HTTP, com specs de todos os métodos.
3. Criar utilitários de rótulos/datas, validação de motivo e recuperação da intenção.
4. Criar tela, cards de configuração/prévia e visualização geral por faculdade.
5. Implementar confirmação manual, correção, UUID persistido e recuperação após falhas.
6. Implementar histórico/detalhe, conteúdo congelado e atualização limitada.
7. Registrar rota/menu e atalho ADMIN em Grades.
8. Executar testes, TypeScript e build; validar visual/acessibilidade.
9. Homologar SMTP com destinatários controlados, sem ligar automático antes da entrega comprovada no telefone/computador do destinatário.
10. Atualizar `DOCUMENTACAO_APLICACAO.md` com rotas, contratos, operação e resultados reais, distinguindo testes automatizados de validação SMTP.

Não remover implementação existente por comandos destrutivos. A separação já é feita pela nova branch baseada na principal. Não mesclar a branch do WhatsApp para reaproveitar serviços: os DTOs, público, estados e autenticação de recebimento são diferentes.

## 12. Testes e critérios de aceite

### Automatizados a adicionar

- Serviço: método/URL/corpo dos seis endpoints, paginação e UUID no caminho; POST sem identidade, público, e-mails, assunto, HTML ou PDF.
- Rota/menus: ADMIN acessa; ALUNO/MOTORISTA não recebem item nem administração; atalho de Grades apenas navega.
- Consulta: configuração indisponível não impede consultar prévia/histórico; cada falha é distinta de vazio e de dados atuais.
- Transporte: todas as viagens retornadas, várias grades, múltiplas faculdades, agrupamento sem inflar total, número do ônibus e motorista destacados.
- Campos nulos, zero, destino ausente, pontos na ordem recebida e veículo indisponível com avisos visíveis.
- Filtros de pesquisa não modificam POST nem mensagem exata retornada.
- Envio sem viagens/elegíveis/disponibilidade bloqueado; confirmação necessária; duplo clique produz um POST.
- Correção: motivo vazio/espaços/limites, preservação em 400/409/503 e corpo sem campos extras.
- UUID: intenção persistida antes do POST, resposta 202 limpa pendência e mostra processamento, nunca entrega confirmada.
- Recuperação: JSON inválido, UUID inválido, outro ADMIN, falha de storage, recarga, timeout e retorno tardio; nenhum POST automático.
- Mesmo UUID/corpo ao retomar; detalhe 404 não gera ID novo; intenção de outro dia não envia programação nova silenciosamente.
- Chave automática conserva estado em erro e permite desligar quando indisponível; ativação só muda após PUT.
- Histórico: paginação real, `totalElementos`, troca de tamanho, cancelamento de GET anterior e respostas fora de ordem.
- Detalhe: todos os estados, revisões, tentativas, mensagem congelada distinta da prévia atual, totais reais e erros seguros.
- Polling: apenas PENDENTE/PROCESSANDO, sem GET concorrente, limite/fechamento/destruição/erro encerram; nenhum POST por timer.
- Datas: dia civil preservado, timestamps em São Paulo, ausência de horário não inventada.
- Segurança: interpolação não executa HTML cadastrado; não existe `bypassSecurityTrustHtml` nem credencial SMTP no bundle.
- Preservar testes existentes de autenticação, financeiro, dashboard, manutenção e CRUDs.

Comandos previstos, usando o runtime existente do projeto:

```text
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm test -- --watch=false --browsers=ChromeHeadless
npm run build -- --configuration production
```

Registrar número de specs/testes efetivamente descobertos na base e após implementação; não transportar automaticamente os resultados da branch do WhatsApp para esta branch.

### Validação manual pendente

- Desktop/celular e claro/escuro, cards objetivos, sem rolagem horizontal da página.
- Navegação por teclado, foco e diálogos acessíveis.
- ADMIN consulta hoje com e sem programação; aluno/motorista não acessam a administração.
- Segunda/terça consultam a grade correta; viagens de vários destinos aparecem nas seções adequadas.
- Envio real para endereços controlados: conferir HTML/texto, acentos, ônibus, motorista, pontos e ausência de outros destinatários visíveis.
- Testar indisponibilidade SMTP, conta/e-mail alterados antes da fila, resultado incerto e retomada sem duplicação indevida.
- Validar correção com motivo e proteção diária entre manual/automático.
- Confirmar automático às 15h, recuperação antes das 18h, backend ligado/navegador fechado, somente após autorização para envios reais.

### Resultado da implementação frontend

- Guia recebido lido e contratos confrontados com o backend em leitura.
- Nova branch criada a partir da principal confirmada, preservando o WhatsApp.
- Tela, serviço, modelos, utilitários, testes, rota/menu ADMIN e atalho em Grades implementados, seguindo a organização por entidade.
- Recuperação de intenção validada no storage, paginação real, GETs canceláveis, diálogos de confirmação/detalhes e polling limitado implementados. O limite cancela também GET lento em andamento.
- Baseline: **209/209 testes**, 50 specs. Após a implementação: **292/292 testes**, 54 specs; aplicação e testes aprovados em TypeScript.
- Build de produção final aprovado, sem avisos: 1,09 MB bruto / 194,53 kB estimados para transferência.
- O npm global estava com shim quebrado; foram usados os binários locais de TypeScript/Angular via Node, sem instalar dependências. Karma/build precisaram de autorização de acesso aos arquivos locais.
- No navegador, a rota sem sessão redirecionou corretamente a `/login?retorno=%2Fprogramacao-email`, sem sidebar. Após login ADMIN feito pelo usuário, foram conferidos cards, avisos, programação, prévia textual, itinerário/pontos e fechamento por Escape, em 1440px/360px no modo escuro. Não houve overflow horizontal do documento/main nem do diálogo da prévia; console de erros vazio. Avisos foram compactados e nomes acessíveis de fechamento ajustados após a revisão.
- O backend real retornou integração desativada, SMTP/remetente/lista de teste ausentes, zero elegíveis e histórico vazio; envio/correção/ativação permaneceram bloqueados. Modo claro, envio SMTP real e automático permanecem pendentes; cenários de lote/recuperação são cobertos por testes HTTP automatizados.
- `DOCUMENTACAO_APLICACAO.md` atualizada. Backend, guia recebido e diagrama não foram alterados.
- Nenhum e-mail foi enviado, automático ativado, credencial configurada, commit ou push realizado nesta etapa.

## 13. Fora do escopo

PDFs, grupos/WhatsApp, assinatura por telefone, inscrição/cancelamento pessoal sem endpoint, escolha manual de destinatários, mensagens individuais por faculdade, editor livre de conteúdo, envio para datas passadas/futuras, viagens sem programação tratadas como confirmadas, rastreamento de leitura, webhook de entrega, criação de SMTP no navegador, renovação de tokens e alterações nos módulos existentes além de rota/menu/atalho documentados.
