# Relatórios financeiros e Contas a pagar — frontend

Implementação em 16/10/2026, baseada no `GUIA_RELATORIOS_FRONTEND.md` fornecido pelo backend. O guia recebido, as migrações e o backend não foram alterados. Este documento descreve o comportamento entregue, não autoriza operações financeiras reais.

## Acesso e uso

- ADMIN: Financeiro → Relatórios (`/relatorios`). ALUNO/MOTORISTA não veem o item e são impedidos pelos guards.
- Inadimplência é a opção inicial. Fluxo e acerto começam no mês atual de São Paulo; o fluxo usa primeiro/último dia do mês.
- A abertura carrega somente opções de cadastros. Nenhum relatório é consultado automaticamente: clicar em Consultar ou Baixar PDF.
- Mudar relatório/filtros limpa o resultado. Durante consulta/download, os filtros ficam bloqueados. Consultas são canceladas na destruição/invalidação.
- Totais e saldos são apresentados como vieram do servidor. Zero não é ausência; valores monetários nulos aparecem como “Não informado”. Não há cálculo contábil no Angular.
- Datas civis usam `dd/MM/yyyy` sem conversão de fuso. Emissão usa America/Sao_Paulo. Locale `pt-BR` centralizado no bootstrap e no ponto de entrada dos testes.

## Relatórios

| Tipo | Filtros enviados | Apresentação |
|---|---|---|
| Inadimplência | alunoId, vencimentoInicio, vencimentoFim opcionais | Alunos, arquivamento, contatos/matrícula, cobranças, atraso e totais |
| Fluxo | dataInicio, dataFim obrigatórios | Saldo inicial, entradas, saídas, saldo final e movimentos ordenados |
| Acerto | mes obrigatório, motoristaId opcional | Lançamentos e totais por motorista, competência, classificação, previsto/pago/saldo |

Alunos são carregados com `situacao=TODOS`, incluindo arquivados. Nomes recuperados pelo resultado completam opções faltantes sem substituir o ID selecionado. Fluxo preserva a sequência do backend e usa chave composta `tipo:id`, pois recebimentos e pagamentos podem ter o mesmo ID. Competência não é confundida com vencimento. Avisos globais e por lançamento permanecem visíveis, inclusive códigos novos desconhecidos.

Todos os endpoints JSON têm a correspondente rota `/pdf`. Download usa o interceptor JWT, Blob e `Content-Disposition`; sanitiza nome, admite UTF-8, remove o link temporário e revoga a URL. PDF vazio no sentido de “sem linhas” é permitido; arquivo de zero bytes é tratado como falha. Não há jsPDF, JasperReports no navegador, `window.open` autenticado ou cache compartilhado. Tela e PDF são consultas independentes e podem refletir posições diferentes.

## Saldo base

- GET `/financeiro/saldo-base` ao entrar no fluxo. Somente seu 404 significa primeiro cadastro e abre o formulário; 404 de relatório não faz isso.
- Explicação: “Informe o saldo existente na abertura desta data, antes das movimentações daquele dia.”
- PUT explícito; data válida e valor com até duas casas decimais, inclusive negativo. Primeiro cadastro envia `versao:null`; edição preserva versão zero ou superior.
- Em 409, somente GET de recuperação. O formulário recebe a versão atual e exige revisão; nenhuma gravação é repetida automaticamente. Falha na recuperação bloqueia gravação com versão antiga.
- Fluxo não aceita início anterior à base. Salvar invalida o resultado e exige nova consulta.

## Cadastro de contas a pagar

Mantidos os endpoints `/contapagar/listar`, `/buscar-contapagar/{id}`, `/salvar-contapagar`, `/atualizar-contapagar/{id}` e `/deletar-contapagar/{id}`.

Novo formulário envia somente descrição, valor, vencimento, competência, classificação e `motorista:{id}` ou null. Esse nome de campo é legado: despesas podem vincular pessoas de outros papéis. Opções combinam motoristas, alunos não arquivados e administradores pelo **pessoaId**, nunca pelo ID de usuário. Um vínculo antigo ausente das opções é preservado na edição.

Salário exige motorista e competência; duplicidade por motorista/mês permanece validada pelo backend. A tela explica recorrência mensal e preservação do dia 31 depois de fevereiro. Não cria agendador nem novas contas automaticamente no navegador.

Antes de editar ou preparar exclusão, consultar conta e lista de comprovantes. Qualquer comprovante, mesmo zero/negativo, ou status PAGO protege valor/beneficiário e impede exclusão. Campos protegidos são enviados a partir do registro consultado, não dos controles. Descrição, competência, classificação e vencimento podem ser corrigidos. Em conflito, recarregar e exigir revisão; nunca repetir PUT/DELETE automaticamente.

Não há seletor de status financeiro. Quitação e reabertura não são simuladas por edição de status. Backend antigo sem valorPago/saldoRestante/pagamentoParcial/avisos é rejeitado com mensagem de incompatibilidade; a tela não inventa saldo por subtração.

## Pagamentos parciais e recuperação

1. Consultar conta atual ao abrir o modal e preencher pelo saldo restante.
2. Validar valor positivo, até duas casas decimais, dentro do saldo. Reconsultar antes de uma intenção nova.
3. Gerar UUID, persistir intenção por administrador e enviar POST `/pagamentos/realizar/{contaId}` com formaPagamento, valorPago e `Idempotency-Key`.
4. Enquanto pendente, bloquear duplo clique, edição da conta envolvida e novas intenções de pagamento.
5. Em rede/5xx/409 ou resposta inesperada, manter a chave e parâmetros. Apenas a ação explícita de repetição envia a mesma operação. Uma intenção restaurada que omitia valorPago continua omitindo esse parâmetro.
6. Em sucesso, marcar REGISTRADA e recarregar lista, conta e comprovantes. Só depois limpar o registro pendente. Se a atualização falhar, permitir somente atualização, nunca outro POST.
7. Novo pagamento após conclusão usa nova chave e a nova posição financeira.

Registro local: `integrador.pagamento.pendente.{adminId}` em sessionStorage, contendo versão, adminId, contaId, forma, valor opcional, UUID e estado. Sem credenciais, PDFs, nomes ou relatórios. Registro inválido/ilegível bloqueia pagamentos e exige conferência manual antes de liberar. Se não for possível salvar a chave, nenhum POST é enviado.

Uma intenção incerta pode ser encerrada somente depois de consultar conta/comprovantes e marcar confirmação consciente. Essa ação remove a pendência **local**: não cancela processamento no backend nem desfaz pagamento. A leitura dos comprovantes não prova, sozinha, o resultado de uma chave. Encerrar antes de o servidor terminar exige decisão do administrador, avisada na tela. Intenções REGISTRADAS não usam esse caminho de descarte.

Avisos que bloqueiam pagamento: valor inválido, pagamentos negativos legados, pagamentos superiores à conta e quitação histórica sem comprovante. Outros avisos continuam visíveis. STATUS_DIVERGENTE não é usado sozinho para impedir pagamento quando o servidor informa saldo positivo.

Os campos monetários de entrada também rejeitam valores cujos centavos ultrapassem a precisão inteira segura de JavaScript. Não arredondam silenciosamente nem enviam frações de centavo; o backend continua sendo a autoridade.

## Comprovantes e atualização de dados

- GET `/pagamentos/conta/{contaId}` preserva todos os recibos na ordem do backend, incluindo contas parciais; vazio é um resultado válido e 404 é erro de recurso inexistente.
- Cada recibo usa seus próprios campos retornados, inclusive valor, data, descrição e beneficiário. Não representa sozinho a quitação integral.
- Mantido o método do recibo mais recente para compatibilidade, sem usá-lo para substituir o histórico completo.
- Botões de fechamento seguem o padrão: ×, cor secundária e texto sem borda.
- `FinanceiroEventos` não armazena dados: apenas invalida o relatório em memória e solicita atualização do dashboard ADMIN. Instâncias são descartadas na navegação; não há cache financeiro persistente/compartilhado.

## Validação e homologação

Testes automatizados usam `HttpTestingController`, fixtures fictícias e navegador headless. Nenhum teste usa SMTP, banco real, token de produção ou pagamento real.

Cobertura: guards/menu, parâmetros, opcionais omitidos, datas/períodos/competência, totais legados, vazios, avisos, HTML tratado como texto, nome/erro Blob/URL temporária do PDF, saldo base e conflitos, CRUD, vínculos genéricos, comprovantes zero/negativos, retentativa com mesma chave, restauração da sessão, bloqueio de duplo clique, atualização pós-sucesso e invalidação do dashboard.

Resultados finais de TypeScript, suíte e build estão registrados em `DOCUMENTACAO_APLICACAO.md`. A primeira execução evidenciou o carregamento separado de locale nos polyfills; o ponto de entrada de testes foi ajustado para usar a mesma inicialização do bootstrap. A execução posterior passou.

Validação da integração original: TypeScript da aplicação/testes aprovado; **460/460 testes aprovados em 62 specs**; build de produção sem avisos, inicial 1,10 MB e transferência estimada 197,46 kB. Acréscimo líquido de 99 testes sobre a baseline de 361.

Refinamento visual posterior, também em 16/10/2026: removida zebra de todas as tabelas que a habilitavam; Contas a receber e Minhas matrículas adotam o layout financeiro compartilhado. Ações por linha são ícones circulares com tooltip/aria-label, mantendo textos explícitos em confirmações de pagamento/exclusão. Fluxo passou a `p-table`, preservando chave tipo/ID e ordem dos movimentos. Pesquisa sem acentos e reinício da paginação ao trocar seleção/filtro. **467/467 testes aprovados**, 62 specs; build sem avisos, transferência estimada 197,57 kB. Pagar/receber conferidos em 1440/360 px no modo escuro, sem modificar registros.

Após login realizado pelo usuário, conferidos em modo escuro: inadimplência com resultado real, acerto vazio do mês atual, lista de contas abertas/quitadas, comprovantes vazios/existentes e abertura do recibo. Edição de conta paga mostrou valor e beneficiário bloqueados. Relatório conferido em desktop 1440 px e filtros/modal de saldo base em 360 px. O backend real respondeu que não há saldo base: o formulário abriu sem gravar nada e o fluxo permaneceu bloqueado corretamente.

Download autenticado real de inadimplência concluído, com arquivo `C:/Users/melhe/Downloads/inadimplencia.pdf` de 39.017 bytes. Não foi executada revisão do layout interno do PDF nesta entrega; sua geração é responsabilidade do backend. Outros PDFs e fluxo completo têm testes simulados, não homologação real.

Pendentes: cadastro real de saldo base pelo administrador, fluxo completo, PDFs de acerto/fluxo, modo claro, teste de concorrência entre dois administradores e revisão de lançamentos legados. Operações reais de cadastro/exclusão/pagamento e saldo base devem ser realizadas pelo administrador em ambiente de homologação com dados descartáveis, não durante esta implementação.

Nenhuma migração, configuração real de saldo, operação financeira, commit ou push foi executado nesta entrega.
