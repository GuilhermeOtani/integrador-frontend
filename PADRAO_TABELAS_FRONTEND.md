# Padrão compartilhado de tabelas

## Entrega de 16/10/2026

As listagens seguem o modelo de Contas a pagar: cabeçalho com título e descrição curta, ações gerais, pesquisa/filtros acima da tabela e painel com bordas suaves. São 23 declarações PrimeNG em 18 templates e a tabela HTML da série mensal do dashboard, totalizando 24 tabelas. Inclui detalhes e históricos em diálogos.

Abrangência: alunos, motoristas, ônibus, faculdades, rotas, pontos, grades e suas viagens, usuários e pessoas disponíveis, manutenção, chamados pessoais, viagens pessoais, contas a pagar/receber, mensalidades e recebimentos, lotes/entregas de e-mail, três relatórios e série mensal do dashboard.

## Camada compartilhada

Arquivos em `src/app/shared/ui/tabelas/`:

- `tabelas.css`: estilos globais explicitamente delimitados pelas classes do padrão, importados em `src/styles.css`. Usa tokens do tema PrimeNG para claro/escuro, sem zebra, com hover discreto, separadores, paginação e rolagem horizontal dentro do painel.
- `tabela-padrao.ts`: diretiva standalone `TabelaPadrao`, aplicada como `appTabelaPadrao` no próprio `p-table`. Não substitui nem encapsula a tabela, preservando referências de exportação, seleção e templates específicos.
- `acao-tabela.ts`: componente standalone `AcaoTabela`, seletor `app-acao-tabela`, encapsulando `p-button` e tooltip.
- `estado-lista.ts`: estado de carregamento/erro das seis listagens legadas de cadastro. Acompanha a consulta existente, sem cache, novas consultas ou repetição automática; mantém o carregamento enquanto houver consultas concorrentes e encerra assinaturas ao destruir a tela.

### Convenção de layout

Usar `app-listagem`, `app-cabecalho`, `app-acoes`, `app-tabela-painel`, `app-tabela-ferramentas`, `app-campo-pesquisa` e `app-acoes-linha`. Cada cabeçalho e célula correspondente declara `app-col-texto` ou `app-col-centro`, sem inferência pelo conteúdo ou posição.

Nomes, descrições, endereços, e-mails e textos longos ficam à esquerda. IDs, documentos, telefones, matrículas, placas, datas, competências, quantidades, valores monetários, status, seleções e ações ficam no centro. Colunas compostas seguem o dado principal: descrição com avisos à esquerda; competência com vencimento no centro. Modelo de ônibus e nomes de rota/faculdade são textos; papel, tipo e forma de pagamento são informações compactas centralizadas.

Valores mantêm `app-valor`/`valor` e números tabulares. Células simples compactas recebem `app-dado-compacto` para não quebrar CPF, telefone ou data no meio. Cabeçalhos longos e descrições continuam podendo quebrar; rolagem horizontal permanece dentro do painel. Conteúdo alinha verticalmente ao meio.

Cabeçalhos ordenáveis agrupam título e ícone em `span.app-titulo-coluna`, preservando o `th` como `table-cell` e a ordenação no cabeçalho original. `app-acoes-linha` centraliza grupos de botões; ações únicas seguem o alinhamento da célula. Grupos flex de badges centralizados usam `app-grupo-celula`, sem centralizar os avisos das descrições. A tabela nativa recebe as mesmas classes, preservando caption e scope.

Importar `TabelaPadrao` no componente e adicionar `appTabelaPadrao` ao `p-table` existente. A diretiva desliga zebra e habilita hover. Apenas quando a tabela já possui paginação, padroniza o relatório para `Mostrando {first} a {last} de {totalRecords} registros`. Não altera tamanho de página, dados, seleção, ordenação ou paginação de servidor; não introduz paginação nos detalhes/relatórios.

A série mensal mantém tabela HTML semântica, caption acessível e cabeçalhos próprios, com acabamento `app-tabela-nativa`. Cards e listas não foram transformados em tabelas.

### Ações dos registros

```html
<app-acao-tabela icon="pi pi-pencil" ariaLabel="Editar registro"
  [disabled]="ocupado" (acionar)="editar(registro)" />
```

`icon` e `ariaLabel` são obrigatórios. `tooltip` é opcional e usa o nome acessível como padrão. Há entradas `severity`, `disabled`, `loading` e `tooltipPosition`. O evento `acionar` entrega o evento original somente quando habilitado e fora de carregamento. O botão interno é `type="button"`, circular e contornado, sem texto visível. O tooltip fica no contêiner para explicar inclusive ações bloqueadas.

Ícones: lápis para editar, lixeira para excluir, olho para detalhes/recibos, check para pagar e ícones específicos para arquivar, restaurar, atender e criar acesso. Usuários conserva o menu de reticências com opções identificadas e proteções da própria conta. Botões gerais e de confirmação continuam com texto.

## Conteúdo e preservação funcional

Foram removidas da marcação as notas técnicas fixas sobre backend, permissões, recorrência e proteção de histórico junto às tabelas. Não são ocultadas por CSS. Totais, identificadores, erros, avisos por registro, pendências financeiras/idempotentes e orientações dos diálogos foram preservados.

APIs, cálculos, regras financeiras, permissões, filtros, exportação CSV, seleção e arquivamento não foram redefinidos. Relatórios mantêm a ordem contábil retornada; e-mails mantêm paginação no servidor. As seis listagens antigas receberam estados visíveis de carregamento/erro/vazio, com atualização manual pelo GET já existente.

## Validação da entrega inicial de padronização

- TypeScript dos testes: aprovado com `tsc --noEmit -p tsconfig.spec.json`.
- Suíte Angular completa: **554/554 testes aprovados, em 69 specs**, ChromeHeadless. São 22 testes adicionais em quatro arquivos: ação compartilhada, diretiva, estado de listagem e integração das seis listagens/consultas e permissões de leitura ALUNO.
- Build de produção: aprovado, sem avisos; bundle inicial 1,10 MB bruto / 197,78 kB estimados para transferência. Nenhum limite de tamanho foi aumentado.
- `git diff --check`: aprovado.
- Regressões financeiras, autenticação, e-mail, arquivamento, manutenção e dashboards incluídas na suíte. Testes usam dados simulados; não realizam operações reais.

### Conferência com backend real

Após login feito pelo usuário, ADMIN foi conferido no modo escuro em desktop (1440px) e celular (360px). Foram consultadas listagens de cadastros, usuários, manutenção, contas e programação de e-mail. Pesquisa de faculdade e abertura/cancelamento da edição foram conferidas sem salvar. O menu da própria conta preservou ações bloqueadas. Todas as páginas medidas mantiveram largura do documento igual à viewport; tabelas largas rolam internamente.

No celular também foram conferidos a série mensal como tabela acessível e o resultado vazio de inadimplência após Consultar. A tabela de Contas a receber foi conferida sem a antiga nota fixa e com ações somente por ícones.

Pendências de homologação desta refatoração: modo claro, sessão real de ALUNO/MOTORISTA, demais estados com dados reais (incluindo relatórios preenchidos e históricos/modalidades sem registros no ambiente). Os testes automatizados de papéis e estados não equivalem a essa homologação visual.

Nenhum cadastro foi salvo/excluído, nenhum pagamento ou envio de e-mail foi executado e não houve commit/push. Backend, guias recebidos e diagrama foram preservados.

## Revisão de alinhamento — 16/10/2026

As 24 tabelas receberam alinhamento explícito por tipo, tanto no cabeçalho quanto no corpo, inclusive detalhes, relatórios e série mensal. Regras anteriores de alinhamento monetário à direita e classes locais conflitantes foram removidas. Não houve alteração de APIs, eventos, expressões de dados, filtros ou operações.

Validação automática desta revisão: **558/558 testes aprovados em 70 specs**, incluindo quatro novos testes de CSS computado, cabeçalhos ordenáveis, valores ausentes, avisos, badges, ações únicas/múltiplas e tabela nativa. Os seis testes de listagens reais agora também comparam o alinhamento computado do cabeçalho com cada célula e verificam campos compactos. TypeScript de aplicação/testes e `git diff --check` aprovados. Build de produção aprovado sem avisos: 1,10 MB bruto / 197,97 kB estimados para transferência; nenhum budget foi aumentado. A auditoria estática confirmou marcação correspondente nos 24 templates de tabela, sem mudanças de conteúdo ou expressões além da apresentação.

Conferência visual real desta revisão: ADMIN, modo escuro, alunos e Contas a pagar em 1440px e 360px. Verificados valores diferentes, correspondência de títulos/dados, grupos de status/ações e largura do documento igual à viewport com rolagem interna. Não foram alterados registros. Textos longos, múltiplos avisos e valores ausentes foram conferidos com dados simulados nos testes; não foram criados dados reais para preencher esses cenários. Modo claro, demais perfis e conferência manual das outras telas permanecem pendentes nesta revisão.
