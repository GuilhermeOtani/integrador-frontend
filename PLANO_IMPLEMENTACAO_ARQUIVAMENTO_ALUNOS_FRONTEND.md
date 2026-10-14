# Arquivamento de alunos — implementação frontend

## 1. Status e referência

Implementação frontend realizada em 14/10/2026, na branch existente `codex/integracao-email`, preservando as alterações anteriores de e-mail. Não houve commit/push, mudança de branch, implementação backend ou alteração de alunos reais.

Referência de contrato: `GUIA_ARQUIVAMENTO_ALUNOS_BACKEND.md`. Na leitura local, `AlunoController` ainda não apresentava PATCH de arquivamento, consulta de condições ou filtro/campo de arquivamento. A homologação integrada permanece pendente; não confundir frontend implementado com regras de servidor já disponíveis.

## 2. Contratos utilizados

| Operação | Requisição | Comportamento esperado |
|---|---|---|
| Lista | `GET /aluno/listar?situacao=NAO_ARQUIVADOS\|ARQUIVADOS\|TODOS` | Array com campo booleano `arquivado`; padrão não arquivados |
| Arquivar | `PATCH /aluno/{id}/arquivamento`, `{ arquivado: true }` | Aluno atualizado; histórico preservado |
| Restaurar | Mesmo PATCH, `{ arquivado: false }` | Cadastro restaurado; usuário continua desativado |
| Consultar exclusão | `GET /aluno/{id}/situacao-exclusao` | `alunoId`, `arquivado`, `podeExcluir`, `possuiAcesso`, quatro contagens em `vinculos` e `impedimentos[]` |
| Excluir | `DELETE /aluno/deletar-aluno/{id}` | `204` somente após revalidação dos vínculos no servidor |

Todas as operações de tela permanecem em `/alunos`, protegida para ADMIN pela rota existente. O serviço reutiliza API URL e interceptor JWT. O frontend não envia identidade administrativa, motivo financeiro, estado de cobrança ou atualização de usuário nesses contratos.

Cadastro e edição mantêm os endpoints existentes e serializam somente `nome`, `cpfCnpj`, `telefone`, `matricula`, `mensalidade` e `faculdadeId`. Não enviam `arquivado`, e-mail, objeto de faculdade ou campos de acesso, evitando mudanças de arquivamento pelo formulário comum.

## 3. Interface

- Cabeçalho compacto com atualização, cadastro, exportação e arquivamento dos selecionados.
- Filtros pesquisáveis pela lista: não arquivados, arquivados e todos; o filtro cadastral é consultado no servidor, a pesquisa textual é local.
- Tag de arquivamento independente do status financeiro/matrícula. Dados antigos sem campo mostram situação não informada, nunca não arquivado presumido.
- Não arquivados oferecem editar e arquivar; arquivados oferecem editar, restaurar e consultar exclusão definitiva.
- Confirmações explicam interrupção de acesso/envios/novas mensalidades e preservação das dívidas e recibos.
- Restauração orienta reativação separada em Usuários e não promete redefinição de vencimento.
- Diálogo de exclusão apresenta contagens, impedimentos completos, existência de acesso, atualização manual e aviso de irreversibilidade.
- Botões por linha e fechamento de diálogos têm nomes acessíveis. Textos retornados pela API usam interpolação, não HTML confiável.
- PrimeNG e variáveis de tema preservam cores e suporte claro/escuro; filtros/contagens passam a uma coluna no celular, diálogos limitam sua largura ao viewport e tabelas mantêm rolagem interna.
- Retirada a antiga ação de exclusão em lote que anunciava sucesso sem comunicação com o servidor. Não há DELETE em lote.

## 4. Consistência e falhas

### Consultas

- Consultas anteriores da lista são canceladas ao atualizar/trocar filtro. Seleção é preservada por ID em atualização e limpa ao trocar filtro.
- Consultas de vínculos são canceladas no fechamento, substituição e destruição; condições anteriores deixam de valer enquanto uma nova consulta carrega.
- Erro de lista preserva dados existentes com aviso de desatualização e bloqueia as novas operações.
- Backend sem campo/filtro não recebe sucesso simulado: ações ficam indisponíveis e o guia pendente é informado. Não fabricar arquivamento em storage.

### Arquivamento/restauração

- Nenhum PATCH antes da confirmação. Enquanto processa, impede cliques duplicados, outras ações e fechamento da confirmação.
- Snapshot dos alvos com IDs deduplicados. Lote envia sequencialmente e registra sucesso, falha ou não solicitado para cada alvo.
- Linha só é atualizada após resposta com ID e estado correspondentes ao solicitado; sai da lista se não pertencer mais ao filtro atual.
- Sucessos são retirados da seleção; falhos permanecem selecionados. Uma falha conhecida permite continuar outros itens, sem anunciar sucesso global falso.
- Rede/status 408/5xx, resposta incompatível ou 401/403 interrompem itens restantes. Atualização da lista é necessária antes de novas operações.
- Não há retry automático. Depois de um resultado, fechar a confirmação e iniciar outra intenção pelos cadastros remanescentes; não repetir o snapshot inteiro.
- Destruir a tela cancela a requisição cliente e impede próximos itens. Isso não promete desfazer uma operação já recebida pelo servidor.

### Exclusão definitiva

- Abre somente para arquivado e consulta as condições primeiro; uma resposta GET não dispara DELETE.
- Autorizar somente com ID correspondente, campos booleanos completos, contagens inteiras não negativas, estado arquivado, `podeExcluir=true`, zero vínculos e nenhum impedimento.
- Resposta incompleta/contraditória bloqueia exclusão e informa incompatibilidade.
- Em `409`, preserva cadastro/seleção e exibe mensagem e contagens seguras retornadas; autorização antiga é descartada. Nova consulta explícita é necessária.
- Resultado incerto mantém a linha sem afirmar que o servidor não excluiu; exige atualização da lista e não repete DELETE.
- Mensagens de rede/autenticação/autorização ficam no contexto, sem novo toast que duplique os interceptores globais.

## 5. Responsabilidades do backend

Somente o servidor pode assegurar revogação de JWT, suspensão de e-mails/recorrência, preservação financeira, proibição de reativação enquanto arquivado, transações, concorrência e exclusão sem vínculos. O Angular não altera matrícula, cobranças, usuários ou histórico para simular essas regras.

Implementar o guia antes da homologação real. E-mails já enviados ou em chamada SMTP iniciada não podem ser recolhidos pelo frontend. Restaurar não deve reativar usuário nem gerar uma cobrança imediatamente; recorrência posterior segue o contrato do guia.

## 6. Validação executada e pendências

| Verificação | Resultado |
|---|---|
| Baseline anterior | 292 testes, 54 specs |
| TypeScript aplicação | Aprovado: `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` |
| TypeScript specs | Aprovado: `node node_modules/typescript/bin/tsc -p tsconfig.spec.json --noEmit` |
| Karma/Chrome Headless | **351/351 aprovados**, 55 specs; 59 testes líquidos novos |
| Build de produção | Aprovado: `node node_modules/@angular/cli/bin/ng.js build --configuration production`; inicial 1,09 MB bruto / 194,45 kB estimados, sem avisos; chunk de alunos 36,47 kB / 9,38 kB estimados |
| Backend, migração ou banco real | Não alterados/executados |
| Alunos reais, SMTP ou automático | Nenhuma ação realizada |
| Visual manual/integração real | Pendente das novas APIs e de conferência autenticada |

Karma/build foram executados com permissão ampliada de leitura após a restrição de diretórios do Windows impedir a resolução de arquivos na sandbox. Nenhuma dependência foi adicionada ou configuração global corrigida para contornar isso. TypeScript passou na execução comum.

A cobertura inclui contratos HTTP/payload, filtros, cancelamento, preservação de seleção, backend antigo/incompatível, confirmação/cancelamento, duplo clique, restauração sem reativação, lote sequencial/deduplicado/parcial/interrompido, destruição, condições de exclusão, 204/409, erros incertos, segurança de interpolação e rota exclusiva ADMIN. A suíte anterior de pagamento, recibo, e-mail e permissões continua passando.

Pendências para homologação:

1. Implementar e disponibilizar o guia no backend, com migração aplicada a ambiente de teste.
2. Conferir os três filtros e respostas completas com ADMIN.
3. Com dados de teste explicitamente autorizados, arquivar/restaurar um aluno e confirmar conta, JWT, recorrência e e-mails no servidor.
4. Conferir exclusão bloqueada por cada vínculo e exclusão permitida sem vínculos; não apagar cobranças reais para liberar um cadastro.
5. Conferir visual em desktop/celular, ambos os temas, teclado, Escape e foco dos diálogos.
6. Confirmar que não há rolagem horizontal do documento, somente da tabela quando necessária.

Testes HTTP simulados não comprovam aplicação de transações, locks, constraints, migração ou entrega real de e-mail.
