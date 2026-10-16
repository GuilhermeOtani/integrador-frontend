# Contas a receber — entrega frontend

Data: 16/10/2026. Integração do `GUIA_CONTAS_RECEBER_FRONTEND.md`, sem alterações no backend ou no guia recebido.

## Funcionalidades

- ADMIN: lista com competência, original, recebido, saldo em aberto, parcial e avisos; cadastro/edição e exclusão confirmada usando os contratos `/contareceber` existentes.
- ALUNO: posição financeira completa, pagamento integral ou parcial, histórico de todos os recebimentos e abertura de cada recibo. A mesma implementação atende Minhas matrículas e dashboard.
- Dashboard: saldo restante em destaque; valor original e recebido separados. Reconsulta do perfil após pagamento, sem ativação local de matrícula.
- Inadimplência: original/recebido/saldo, competência e avisos por cobrança. Totais permanecem os fornecidos pelo servidor, sem recalcular contabilidade.
- PrimeNG standalone, tabelas sem zebra, rolagem interna, ações por ícone com tooltip/nome acessível, datas civis sem deslocamento e fechamento secundário com ×.

## Permissões e proteção histórica

As permissões do guia foram mantidas: ADMIN administra cobranças e relatórios, não registra pagamentos como aluno e não consulta os recibos restritos ao ALUNO. O histórico não envia IDs de aluno/usuário no HTTP: a identidade vem do JWT.

Editor e exclusão consultam a cobrança atual. Valor/aluno ficam bloqueados quando a posição demonstra recebimentos ou quitação histórica. A API administrativa não fornece quantidade de recibos, logo o frontend não pode detectar com certeza um histórico de soma zero. Nesses casos o backend continua sendo a autoridade final, bloqueia a operação e devolve conflito; a interface não apaga comprovantes para contornar a proteção. Um conflito exige revisão e nova ação explícita, nunca repetição automática.

Novos alunos são selecionados de NAO_ARQUIVADOS. O vínculo histórico permanece disponível na edição, inclusive ausente dessa listagem. Competência, descrição e vencimento são editáveis conforme as regras do servidor; não há edição de status, recebido ou saldo.

## Confirmação e idempotência

1. Abre consultando as próprias cobranças e preenche o valor com saldoRestante.
2. Antes de confirmar, consulta a posição novamente; valor/forma/fechamento ficam bloqueados durante a operação.
3. Valida centavos, valor positivo e limite do saldo. Avisos impeditivos e posição incompleta bloqueiam o pagamento.
4. Gera UUID por intenção e persiste antes do POST em `integrador.recebimento.pendente.{usuarioId}`. Não grava relatórios, PDF, perfil, credenciais ou recibos nesse registro.
5. Rede/500/409 mantêm os parâmetros congelados. “Repetir confirmação” envia mesma conta, chave, forma e valor; mantém a omissão de valorPago quando restaurada de uma intenção compatível.
6. Após sucesso, abre o recibo da parcela e recarrega cobranças, histórico/perfil e tela de origem. Não afirma quitação integral e não altera matrícula localmente.
7. Se o POST foi aceito mas a atualização falhar, mantém REGISTRADA e permite somente atualizar dados. Nunca reenvia esse pagamento.
8. Uma intenção incerta recuperada após recarga bloqueia novas intenções. Para abandonar, primeiro é necessário conferir posição/histórico/perfil e confirmar explicitamente. Abandonar a chave não cancela requisição já recebida pelo servidor.

As chaves são isoladas por usuário e separadas das de Contas a pagar. O usuário autenticado é revalidado antes de agir e ao receber respostas. Storage indisponível/inválido bloqueia novas confirmações. O backend permanece responsável por propriedade, concorrência e idempotência final.

## Recorrência

Não há agendamento no navegador. Primeiro vencimento automático continua em 30 dias; próximos por mês do calendário, preservando dia original (31/01 → fevereiro ajustado → 31/03). Competência avança independentemente do vencimento; editar vencimento redefine o dia da sequência. Restauração de aluno não inicia sequência nova.

## Validação e limites

Testes automatizados usam HTTP/serviços simulados. Cobrem contratos, CRUD, proteção histórica, parcelas, saldo concorrente, idempotência, falhas de rede/500/409, ausência de acesso, recuperação após recarga, isolamento de usuário, erros de storage e atualização após sucesso. Dashboard/inadimplência possuem regressões com original, recebido e saldo distintos.

Conferência real somente leitura: ADMIN autenticado, listagem e formulário de nova cobrança, desktop e 360px em modo escuro. A página móvel não transborda horizontalmente; tabela possui rolagem interna. Nenhuma cobrança foi salva/excluída e nenhum recebimento foi registrado nessa conferência.

Pendentes de homologação assistida: fluxo completo autenticado como ALUNO com parcelas reais, interação visual de todos os estados de recuperação, modo claro, conflitos reais entre sessões e calendário de recorrência. Migrações/JDK/Flyway/PostgreSQL são responsabilidade do backend; nenhuma migração foi executada pelo frontend.

Execuções finais:

- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.spec.json`: aprovado.
- `node node_modules/@angular/cli/bin/ng.js test --watch=false --browsers=ChromeHeadless --no-progress --reporters=dots`: **532/532 aprovados**, 65 specs; 65 testes líquidos acima da entrega anterior (467).
- `node node_modules/@angular/cli/bin/ng.js build --configuration production`: aprovado, sem avisos; inicial 1,10 MB, transferência estimada 197,54 kB.
- `git diff --check`: conferência de whitespace; avisos de conversão LF/CRLF do ambiente Windows não são erros de compilação.

A primeira tentativa de testes no sandbox não conseguiu iniciar ChromeHeadless; reexecutada com a permissão apropriada. A primeira suíte funcional encontrou um mock antigo de autenticação incompleto em Inicio; o mock foi corrigido, com as regressões preservadas. O primeiro build apontou opções readonly incompatíveis com PrimeNG e referência Jasmine num helper compilado junto à aplicação; ambos corrigidos antes das execuções finais.

Não foi feito commit/push.
