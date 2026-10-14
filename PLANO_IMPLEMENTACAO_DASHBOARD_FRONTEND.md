# Dashboard por perfil — implementação do frontend

## 1. Objetivo e situação da entrega

Implementado em 10/10/2026 no Angular existente, seguindo `GUIA_DASHBOARD_FRONTEND.md` e os DTOs reais do backend. A página **Início**, em `/inicio`, reúne as informações úteis de cada papel sem exigir navegação pelos cadastros.

O backend e os guias recebidos não foram modificados. Não foram instaladas dependências. O dashboard não gera mensalidades, não cria viagens e não altera a matrícula ao consultar dados.

## 2. Organização dos arquivos

```text
src/app/components/dashboard/
├── models/dashboard.models.ts
├── service/
│   ├── dashboard-service.ts
│   └── dashboard-service.spec.ts
├── utils/
│   ├── consulta-dashboard.ts
│   ├── dashboard.utils.ts
│   └── dashboard.utils.spec.ts
├── styles/dashboard.css
├── styles/dialog-dashboard.css
├── testing/dashboard.fixtures.ts
└── components/
    ├── inicio/
    ├── dashboard-aluno/
    ├── dashboard-motorista/
    ├── dashboard-admin/
    └── agenda-transporte/

src/app/components/conta-receber/
├── models/conta-receber.ts
└── components/
    ├── minhas-matriculas/
    └── pagamento-matricula/
```

Os componentes específicos têm HTML e spec ao lado do TypeScript. O distribuidor `Inicio` usa template inline. O CSS comum é compartilhado; `AgendaTransporte` possui CSS próprio para cards/itinerário e `DashboardAdmin` mantém os estilos específicos financeiros/operacionais em `dashboard-admin.css`.

### Responsabilidades

| Arquivo/componente | Função |
|---|---|
| `dashboard.models.ts` | Contratos de leitura correspondentes ao JSON do backend |
| `DashboardService` | Consulta os três endpoints usando a URL centralizada |
| `Inicio` | Instancia somente o componente do papel autenticado |
| `DashboardAluno` | Faculdade, transporte e cobrança, com pagamento compartilhado |
| `DashboardMotorista` | Escala e itinerários atribuídos ao motorista |
| `DashboardAdmin` | Financeiro mensal, posição atual e indicadores operacionais |
| `AgendaTransporte` | Cards da ocorrência selecionada, programação compacta e diálogos completos |
| `ConsultaDashboard<T>` | Signals, cancelamento de GET anterior, erro e ciclo de vida |
| `dashboard.utils.ts` | Moeda, prazos, rótulos, validação de mês e horário de São Paulo |
| `PagamentoMatricula` | Uma implementação de confirmação, erros e recibo para as duas telas |

## 3. Navegação, autenticação e autorização

`/inicio` é protegida por `authGuard` e `roleGuard(['ADMIN', 'ALUNO', 'MOTORISTA'])`. O menu Início aparece antes de Meu perfil nos três papéis. `/perfil` e os módulos existentes permanecem disponíveis com as permissões anteriores.

`AuthService.destinoInicial()` passa a retornar `/inicio`. A raiz, URLs desconhecidas e a tentativa de abrir login já autenticado também levam ao início. O retorno interno seguro após autenticação continua funcionando; o guard da rota de destino verifica o papel.

Os três componentes são importados pelo distribuidor, mas somente o escolhido é instanciado. Não há consultas simultâneas aos três dashboards. O JWT continua sendo enviado exclusivamente pelo interceptor existente.

## 4. API e contratos públicos

| Método | Endpoint | Papel | Parâmetros |
|---|---|---|---|
| GET | `/dashboard/aluno` | ALUNO | Nenhum |
| GET | `/dashboard/motorista` | MOTORISTA | Nenhum |
| GET | `/dashboard/admin` | ADMIN | `mes` opcional, `yyyy-MM` |

Não enviar `pessoaId`, `alunoId`, `motoristaId` ou `faculdadeId`. A identidade é obtida no backend a partir do JWT. Não fazer consultas complementares aos CRUDs para montar os resumos.

### Objetos principais

- `ReferenciaDashboard`: `dataReferencia` (`LocalDate`) e `geradoEm` (instante ISO com offset).
- `AlunoDashboard`: referência, aluno, faculdade opcional, transporte, financeiro e avisos.
- `MotoristaDashboard`: referência, motorista, transporte e avisos.
- `AdminDashboard`: referência, mês, financeiro e operação.
- `TransporteResumo`: `viagensHoje`, `agendaSemanal`, `programacaoSemGrade` e `rotas`.
- `ViagemResumo`: ID, grade, ocorrência, rota, ônibus, motorista, faculdades, disponibilidade e avisos.
- `RotaResumo`: ID, nome, descrição e pontos com ID, descrição e ordem.
- `OnibusResumo`: ID, identificação, placa, modelo, capacidade e estado.
- `FinanceiroAluno`: mensalidade cadastrada, cobrança principal, total aberto e total vencido.
- `CobrancaResumo`: ID, descrição, valor, vencimento, status, situação calculada e dias até o vencimento.
- `FinanceiroAdmin`: recebido/pago/saldo do mês, resumos de contas, série mensal e pendências.
- `OperacaoResumo`: indicadores de alunos, ônibus, viagens e chamados, além dos chamados pendentes.

Os detalhes completos e nulabilidade estão em `dashboard.models.ts`. Campos legados nulos são mantidos, sem preenchimento artificial.

Reutilizados: `StatusMatricula` (`ATIV0 | INATIV0 | PENDENTE`, com zero), `StatusOnibus`, `StatusFinanceiro`, `PrioridadeChamado` e `StatusChamado`. `DiaSemana` admite somente segunda a sexta. A situação de cobrança admite `PAGO`, `VENCIDA`, `VENCE_HOJE`, `A_VENCER` e `SEM_VENCIMENTO`.

Os valores monetários e totais são calculados pelo backend. O Angular apenas formata; não soma movimentações para reconstruir contabilidade.

## 5. Início do aluno

### Identificação e cards

Cabeçalho compacto com nome, faculdade e link para Meu perfil. Matrícula, situação cadastral e endereço ficam disponíveis no diálogo Cadastro e resumo financeiro. Referência e atualização aparecem discretamente no rodapé.

Em desktop, os quatro cards usam duas colunas; até 768px, uma coluna na ordem Ônibus, Pontos de embarque, Rota e viagem, Mensalidade. Não há altura fixa para os cards.

| Card | Informação imediata |
|---|---|
| Ônibus | Identificação, placa, estado e motorista |
| Pontos de embarque | Até três pontos da rota, na ordem recebida, com acesso ao itinerário completo |
| Rota e viagem | Nome da rota, data, dia e faculdade do aluno |
| Mensalidade | Valor da cobrança principal, prazo, vencimento e pagamento/recibo |

### Seleção e detalhes do transporte

Um seletor aparece somente com múltiplas ocorrências. Inicialmente seleciona a primeira viagem de hoje; sem viagem hoje, destaca a próxima ocorrência. Ônibus, motorista, rota, pontos e destinos sempre pertencem à mesma ocorrência.

A identidade da seleção é `id:dataOcorrencia`, não apenas o ID: uma viagem pode reaparecer em dias diferentes. A chave fica em um signal no componente do perfil e sobrevive à destruição dos cards durante atualização; se a ocorrência desaparecer, seleciona a primeira disponível. Não é persistida na sessão.

As demais ocorrências ficam em lista compacta, com data, rota, ônibus, Selecionar e Detalhes. Viagens sem programação nunca recebem data artificial. Outras rotas da faculdade aparecem somente quando não estão representadas nas viagens. Seções opcionais vazias não são renderizadas.

Os diálogos usam `styles/dialog-dashboard.css`, com destaque superior, ícones, blocos de dados em duas colunas, itinerário numerado, destinos separados e rodapé de fechamento. Em celulares os campos e destinos ficam em uma coluna e o status aparece abaixo da identificação, evitando quebra do número do ônibus. Pagamento e recibo mantêm a apresentação existente.

O diálogo compartilhado conserva modelo, capacidade, grade, descrição, todos os pontos e todos os destinos/endereço. Avisos idênticos são deduplicados no resumo; a indisponibilidade permanece visível. Não há ponto individual atribuído ao aluno, ônibus exclusivo ou cancelamento automático.

### Mensalidade

O card destaca apenas a cobrança principal; a mensalidade do cadastro e os totais abertos/vencidos ficam no diálogo Resumo financeiro. São valores separados. O backend escolhe a cobrança principal; o frontend não substitui a escolha nem altera o valor.

| Situação | Apresentação |
|---|---|
| VENCIDA | Vencida há N dias, com destaque de perigo |
| VENCE_HOJE | Vence hoje |
| A_VENCER | Vence em N dias |
| PAGO | Pago, sem contador |
| SEM_VENCIMENTO | Sem vencimento, sem contador |
| Cobrança ausente | Nenhuma cobrança cadastrada; sem ações |

As quantidades/valores abertos e vencidos vêm do servidor. Vencidas são parte das abertas. O prazo pertence à cobrança: não representa expiração automática da matrícula, suspensão do login ou alteração local de cadastro.

Cobrança pendente/atrasada com valor e vencimento válidos oferece Pagar mensalidade. Cobrança paga oferece Ver recibo. Dados incompletos mostram aviso de revisão administrativa. Há acesso a todas as cobranças em `/minhas-matriculas`.

## 6. Início do motorista

Apresenta somente as atribuições do motorista autenticado. Cabeçalho compacto com nome e quantidade de viagens hoje; cards de Ônibus, Pontos de embarque, Rota e viagem e Destinos. O card Destinos resume até três faculdades e permite consultar todas. Reutiliza seleção por ocorrência, programação compacta, avisos e diálogo completo. Sem programação só aparece quando há registros.

Atalhos: `/minhas-viagens`, `/meus-chamados` e `/perfil`. Não há indicadores financeiros administrativos, dados sensíveis do motorista ou consulta à listagem administrativa de ônibus.

## 7. Início administrativo

### Movimentações mensais

Na primeira consulta, não enviar mês: o backend decide o mês atual em São Paulo. A resposta preenche o seletor reativo. Mudanças válidas consultam o mês escolhido; ano zero e meses inválidos não geram GET.

`Subject` e `switchMap` cancelam a requisição anterior. Uma falha não encerra o fluxo de novas consultas. Enquanto carregando, os cartões antigos não são apresentados com o novo mês.

Mostrar recebido no mês, pago no mês e saldo das movimentações. O saldo pode ser negativo e não é lucro nem saldo bancário.

O gráfico PrimeNG/Chart.js usa as seis posições recebidas, incluindo zeros. Eixo e tooltip apresentam BRL. O botão Ver valores em tabela expande uma alternativa acessível com mês, recebido, pago e saldo; a tabela começa recolhida e usa aria-expanded/aria-controls.

### Posição atual

As contas abertas/vencidas e os próximos sete dias são independentes do mês histórico selecionado. Mostrar essa distinção na tela. Os sete dias incluem a referência e os seis seguintes. Não somar vencidas com abertas.

Dois cards destacam contas a receber/pagar abertas, vencidas e próximas. Gráfico e pendências ficam lado a lado em telas acima de 1100px. Um painel alterna A receber/A pagar sem nova chamada HTTP e mostra as pendências retornadas com pessoa, descrição, valor, vencimento e situação. Atalhos abrem as listagens atuais, sem prometer seleção de uma conta específica.

### Operação

Quatro cards resumem Alunos, Frota, Viagens e Manutenção. Diálogos preservam todos os indicadores por situação/estado, inclusive Não informado, sem ocupar permanentemente o dashboard.

A lista compacta de chamados mostra veículo, placa, solicitante, relato, data, prioridade e andamento. **Ver chamados deste ônibus** reutiliza `/manutencao?onibusId=<id>`; não abre automaticamente um chamado específico.

Não há pagamento ou alteração financeira no dashboard ADMIN.

## 8. Pagamento e recibo compartilhados

`PagamentoMatricula` foi extraído de Minhas matrículas. Há uma única instância por página, permanentemente montada fora dos blocos de carregamento/erro. Ambas as páginas usam os mesmos diálogos, regras e serviço.

Contrato mínimo `CobrancaParaPagamento`:

```ts
{ id: number; descricao: string | null; valor: number | null;
  dataVencimento: string | null; status: StatusFinanceiro | null }
```

Não converter artificialmente o resumo para `ContaReceber` completa. A seleção é copiada para preservar os dados do comprovante durante as atualizações.

API do componente:

- `abrirPagamento(conta)` e `visualizarRecibo(conta)` recebem a cobrança mínima.
- `podePagar(conta)` verifica situação, valor e vencimento.
- `concluido` emite `ReciboMatricula` após sucesso.
- `reconsultar` solicita atualização após conflito, remoção ou revisão de falha de rede.

O formulário reativo oferece PIX, dinheiro, cartão, boleto e transferência, mantendo o valor bloqueado. O envio usa `POST /recebimentos/realizar/{id}?formaPagamento=...` com corpo `null`. Recibos pagos são consultados em `GET /recebimentos/recibo/conta/{id}`.

Durante o POST, a forma, confirmação e fechamento ficam bloqueados. Não existe retry automático. Após sucesso, abrir recibo e consultar novamente o dashboard/listagem; não apenas mudar uma tag local.

Se a reconsulta falhar após pagamento, o dashboard informa **Pagamento registrado; não foi possível atualizar o painel**. O recibo não desaparece.

O pagamento é um registro interno do sistema, não integração bancária. Não há QR Code, boleto emitido ou captura real de cartão.

## 9. Datas, segurança e erros

- `LocalDate` usa `dd/MM/yyyy` com UTC, inclusive a data de recebimento do recibo.
- `geradoEm` é formatado no horário de São Paulo.
- Dias até o vencimento vêm do backend, não do relógio do navegador.
- Viagens hoje são um subconjunto da agenda; Próximos dias exclui a data de referência.
- Programação ausente nunca usa a data legada da viagem.
- Ônibus não operando ou sem estado permanece visível com aviso, sem cancelamento automático.
- Null é Não informado, não zero, dia atual ou estado OPERANDO.
- Textos são interpolados com Angular; descrições preservam quebras de linha sem HTML arbitrário.
- A atualização ocorre na entrada, manualmente e após pagamento, sem polling.
- Respostas não são persistidas em `sessionStorage`.

| Erro | Tratamento |
|---|---|
| 400 no GET | Mensagem e nova tentativa/correção do mês |
| 400 no pagamento | Manter confirmação e mostrar validação, inclusive `ProblemDetail.errors` |
| 401 | Interceptor encerra sessão |
| 403 | Interceptor abre Sem permissão; não consultar outro papel como alternativa |
| 404 no pagamento/recibo | Não inventar comprovante; solicitar reconsulta |
| 409 no pagamento | Fechar confirmação e reconsultar, sem repetir POST |
| Status 0 no POST | Manter aviso de resposta incerta e bloquear repetição até revisão manual das cobranças |
| Status 0/5xx no GET | Mostrar erro e tentativa manual; nunca transformar falha em zeros/lista vazia |

O aviso global de rede/sessão/permissão não é duplicado em toast local. As páginas podem apresentar mensagem inline. Apenas resposta 200 vazia produz estado Sem registros.

## 10. Validação e aceite

Baseline inicial: 144 testes antes dos dashboards; 196/196 antes do redesign. Resultado do redesign dos cards: 206/206; após a melhoria dos diálogos: **209/209 testes aprovados**, em 50 specs, TypeScript da aplicação/testes e build de produção aprovados sem avisos. Bundle inicial: 1,09 MB, com 194,47 kB estimados de transferência. Build/Karma exigiram execução autorizada fora do sandbox devido à restrição de leitura do compilador Windows.

Cobertura: três endpoints sem identidade, mês opcional, um único dashboard por papel, navegação/menu, transporte completo/múltiplos destinos, hoje sem duplicação, campos nulos, ônibus indisponível, rotas sem viagem, situações de cobrança, valores BRL, erros sem dados fictícios, cancelamento de consulta, saldo negativo, pagamento compartilhado, duplo envio, 400/404/409/status 0 e recibo preservado após falha de atualização.

Cobertura adicional do redesign: cards essenciais versus detalhes, limite de três pontos, todos os destinos no diálogo, seleção sem mistura de dados, mesma viagem em dias diferentes, preservação da seleção após recriação, fallback quando a ocorrência desaparece, deduplicação de avisos, seções vazias ausentes, alternância financeira, tabela acessível recolhida e detalhes operacionais.

A melhoria dos diálogos acrescentou três testes: estrutura completa do transporte e fechamento pelo rodapé, resumo de cobrança/cadastro com zeros e preservação do pagamento, e totais/indicadores/atalhos dos quatro diálogos operacionais.

### Homologação com contas reais — parcial

ADMIN validado após login feito pelo usuário: dados financeiros/operacionais, mudança de mês com posição atual preservada, seis meses do gráfico/tabela, atalho de contas a receber e filtro de manutenção por ônibus. A apresentação foi conferida em 1440px e 360px no modo escuro, sem overflow do documento ou erros/avisos de console. Tabelas estreitas recebem rolagem própria; links multilinha são inline-block para área clicável contínua. A navegação e recarga preservaram a sessão.

Redesign ADMIN conferido novamente em 1440px e 360px no modo escuro, com dados reais: cards, diálogo da frota, fechamento por Escape, alternância Receber/Pagar e tabela expansível. Em 360px, documento de 360px sem overflow e conteúdo do main de 289px sem overflow. ALUNO e MOTORISTA também foram conferidos após login feito pelo usuário, em 1440px e 360px no modo escuro. Foram verificados cards separados, opções próprias de cada perfil, destinos completos no diálogo, seleção de viagem indisponível e preservação da seleção/card/seletor após Atualizar. Em 360px ambos apresentaram documento sem overflow e main de 289px sem overflow. Na conta de aluno consultada não havia cobrança principal: o estado sem cobrança foi validado, não o pagamento real. A conferência de modo claro e pagamento integrado permanece pendente. Nenhuma senha foi registrada nem dados financeiros alterados.

Após a melhoria dos diálogos, o transporte do MOTORISTA foi conferido com dados reais no computador e no celular, no modo escuro: identificação legível, blocos separados, ausência de overflow horizontal e fechamento pelo rodapé. Os diálogos novos do ALUNO/ADMIN estão cobertos automaticamente; sua conferência visual com dados reais e o modo claro continuam pendentes.

1. Login normal de cada papel abre Início; retorno interno ainda funciona.
2. Aluno vê faculdade, todas as viagens relacionadas e itinerários ordenados.
3. Verificar todos os ônibus de hoje e o alerta de indisponibilidade.
4. Confirmar cobrança principal, prazo, pagamento e recibo nas duas telas.
5. Após pagar, confirmar os novos totais/status retornados pelo backend.
6. Motorista vê somente suas atribuições.
7. ADMIN troca o mês, confere valores com as listagens e distingue posição atual.
8. Verificar filtros de manutenção e atalhos.
9. Conferir 360px, desktop, modo escuro e navegação por teclado.
10. Recarregar, sair, expirar sessão e testar URLs proibidas.

O backend respondeu 401 à consulta não autenticada em 10/10/2026. O navegador confirmou que `/inicio` sem sessão redireciona para `/login?retorno=%2Finicio`. Essas verificações e a homologação parcial do ADMIN não substituem a conferência dos outros papéis; suas credenciais devem ser digitadas pelo usuário na página.

## 11. Limites da entrega

Sem mapas/GPS, horários inexistentes no contrato, reserva de assento, ônibus exclusivo, atualização periódica, novas ações financeiras administrativas, alterações no backend, refresh token ou bloqueio automático por vencimento. Não foram adicionados framework E2E ou dependências.
