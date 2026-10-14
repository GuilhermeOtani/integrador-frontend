# Guia backend — arquivamento de alunos e exclusão protegida

**Data:** 14/10/2026

**Status:** especificação para implementação do backend. A criação deste documento não significa que as APIs, a migração ou as proteções abaixo já foram implementadas ou testadas.

## 1. Objetivo

Permitir ao administrador retirar alunos da operação sem apagar cobranças, recebimentos, recibos ou chamados.

A ação principal será **Arquivar**. A exclusão definitiva ficará disponível somente para alunos arquivados sem vínculos financeiros ou operacionais.

Decisões confirmadas:

- Arquivar preserva o cadastro e seu histórico.
- Arquivar bloqueia o acesso e o recebimento de novos e-mails.
- Restaurar o cadastro não reativa automaticamente a conta.
- A exclusão definitiva não apaga cobranças, mesmo que nunca tenham sido pagas.
- Nenhum cadastro real será modificado durante a implementação ou os testes automatizados.

Este guia foi elaborado a partir da leitura do código dos serviços de alunos, usuários, cobranças, recebimentos e e-mails, dos modelos e das migrações existentes. Não representa uma inspeção dos vínculos de um aluno específico no banco real.

## 2. Problema atual

O backend apresenta três comportamentos relevantes:

1. `AlunoService.salvarAluno()` gera automaticamente a primeira conta a receber.
2. A tabela `conta_receber` referencia o aluno pela coluna `aluno_id`.
3. `AlunoService.deletarAlunoPorId()` tenta excluir o aluno sem tratar previamente todos os vínculos.

Consequentemente, até um aluno recém-cadastrado normalmente já possui uma cobrança que impede sua exclusão.

A mensagem atual:

> A operação viola uma restrição de unicidade ou relacionamento

vem do tratamento genérico de `DataIntegrityViolationException`. Ela não identifica qual relação bloqueou a operação.

Chamados já possuem proteção específica, mas contas a receber e outros vínculos ainda precisam de verificação explícita.

O histórico de e-mails não deve ser apontado como impedimento: a migração atual mantém seus identificadores de usuário sem chave estrangeira, justamente para preservar o histórico após a exclusão do acesso.

Outro problema encontrado no frontend: a ação atual de exclusão em lote remove os alunos apenas da lista em memória e anuncia sucesso, sem executar exclusões no servidor. Essa ação deve ser substituída por arquivamento real, conforme a seção 12.

## 3. Modelo e migração

### 3.1 Novo campo do aluno

Adicionar:

```java
private boolean arquivado;
```

Características:

- Nome JSON: `arquivado`.
- Coluna: `arquivado`.
- Valor inicial: `false`.
- Campo independente de `statusMatricula`.
- Alteração exclusivamente pelo endpoint de arquivamento.
- Sem mudança nos valores existentes `ATIV0`, `INATIV0` e `PENDENTE`.

`Aluno` herda de `Pessoa` e utiliza a tabela compartilhada `pessoa`. Portanto, a coluna será criada nessa tabela, embora o comportamento funcional desta entrega seja restrito a alunos.

Não utilizar o status da matrícula como substituto de arquivamento. Um aluno pode estar com matrícula paga e ser arquivado; o histórico financeiro não deve ser reescrito para representar essa decisão administrativa.

### 3.2 Migração Flyway

Criar uma nova migração após a última existente, sem editar as anteriores. Na leitura que originou este guia, a última migração era V7; utilizar V8 se continuar disponível no momento da implementação.

```sql
ALTER TABLE pessoa
    ADD COLUMN arquivado BOOLEAN NOT NULL DEFAULT FALSE;
```

Garantias:

- Todos os registros existentes começam não arquivados.
- Não remover pessoas, contas, recebimentos ou usuários.
- Não alterar matrícula, mensalidade ou faculdade.
- Não introduzir `ON DELETE CASCADE` em relações financeiras.
- Manter o default compatível com inserções de outros subtipos de pessoa.

Nos testes H2, que atualmente geram o esquema por Hibernate, configurar o mapeamento/default equivalente e verificar persistência de alunos, motoristas e administradores. O default precisa valer também quando a inserção de um subtipo não informar a coluna.

## 4. Contratos HTTP

Todos os endpoints desta funcionalidade exigem ADMIN, tanto na configuração de segurança quanto nas operações de serviço. Não depender apenas do bloqueio de menu ou do guard Angular.

### 4.1 Listagem

```http
GET /aluno/listar?situacao=NAO_ARQUIVADOS
```

Valores aceitos:

| Valor | Resultado |
|---|---|
| `NAO_ARQUIVADOS` | Apenas alunos não arquivados |
| `ARQUIVADOS` | Apenas alunos arquivados |
| `TODOS` | Ambos |

- Parâmetro omitido: `NAO_ARQUIVADOS`.
- Valor inválido: `400`.
- Sem resultados: `200` com `[]`.
- Manter os campos atuais do aluno e acrescentar `arquivado`.
- Não interpretar “não arquivado” como matrícula ativa: alunos pendentes também pertencem a essa lista.

A consulta individual existente continuará permitindo ao ADMIN consultar um aluno arquivado.

### 4.2 Arquivar ou restaurar

```http
PATCH /aluno/{id}/arquivamento
Content-Type: application/json
```

Arquivar:

```json
{
  "arquivado": true
}
```

Restaurar:

```json
{
  "arquivado": false
}
```

- Usar um DTO com `Boolean` obrigatório, distinguindo `false` de campo ausente.
- Não aceitar identidade de administrador enviada pelo cliente.
- Retornar `200` com o aluno atualizado, incluindo `arquivado`.
- Campo ausente, nulo ou tipo inválido: `400`.
- Aluno inexistente: `404`.
- Operação repetida com o mesmo estado: `200`, sem efeitos duplicados.
- Não gerar cobrança ou reativar usuário ao restaurar.
- A resposta não deve incluir senha, token JWT, `tokenVersion` ou credenciais de integração.

### 4.3 Consulta de condições de exclusão

```http
GET /aluno/{id}/situacao-exclusao
```

Resposta prevista:

```json
{
  "alunoId": 123,
  "arquivado": true,
  "podeExcluir": false,
  "possuiAcesso": true,
  "vinculos": {
    "contasReceber": 2,
    "contasPagar": 0,
    "chamados": 1,
    "viagens": 0
  },
  "impedimentos": [
    {
      "codigo": "CONTAS_RECEBER",
      "mensagem": "O aluno possui 2 contas a receber vinculadas."
    },
    {
      "codigo": "CHAMADOS",
      "mensagem": "O aluno possui 1 chamado de manutenção vinculado."
    }
  ]
}
```

Regras:

- Contar registros de todos os estados, não somente pendentes.
- Não retornar dados pessoais de terceiros ou detalhes completos das cobranças.
- A existência de acesso não impede a exclusão; o acesso será removido junto ao cadastro.
- Se não estiver arquivado, acrescentar o impedimento `ALUNO_NAO_ARQUIVADO`.
- Os códigos de vínculos serão `CONTAS_RECEBER`, `CONTAS_PAGAR`, `CHAMADOS` e `VIAGENS`.
- Ordenar os impedimentos por: não arquivado, contas a receber, contas a pagar, chamados e viagens.
- `podeExcluir` será verdadeiro somente quando estiver arquivado e todas as contagens impeditivas forem zero.
- A resposta é informativa: o DELETE sempre fará uma nova verificação.
- Aluno inexistente: `404`.

As contagens deverão usar consultas próprias, evitando joins que multipliquem registros e produzam números incorretos.

### 4.4 Exclusão definitiva

Preservar o endpoint:

```http
DELETE /aluno/deletar-aluno/{id}
```

Resultado:

- `204`: exclusão concluída, sem corpo.
- `404`: aluno inexistente.
- `409`: aluno não arquivado ou com vínculos.
- `401`/`403`: tratamento global existente.

Em conflitos conhecidos, utilizar `ProblemDetail` com mensagem específica e propriedades adicionais:

```json
{
  "title": "Exclusão bloqueada",
  "status": 409,
  "detail": "O aluno possui registros vinculados. Mantenha-o arquivado para preservar o histórico.",
  "codigo": "ALUNO_POSSUI_VINCULOS",
  "vinculos": {
    "contasReceber": 2,
    "contasPagar": 0,
    "chamados": 0,
    "viagens": 0
  }
}
```

Para aluno não arquivado, utilizar `codigo=ALUNO_NAO_ARQUIVADO` e orientar a arquivar antes de tentar excluir definitivamente.

Nunca expor SQL, nomes internos de constraints, stack traces ou mensagens brutas do banco ao frontend. Não modificar o tratamento global de unicidade para atribuir todos os conflitos do sistema a alunos.

## 5. Transação de arquivamento

Executar o arquivamento em uma única transação:

1. Buscar e bloquear o aluno para alteração.
2. Localizar o usuário vinculado pela pessoa.
3. Marcar `arquivado=true`.
4. Se houver usuário, definir `ativo=false`.
5. Incrementar `tokenVersion` quando necessário para revogar sessões.
6. Persistir e confirmar a transação.
7. Retornar o cadastro atualizado.

Se qualquer etapa falhar, desfazer toda a operação.

### Comportamentos obrigatórios

- Sem usuário vinculado: arquivar normalmente.
- Cobrança pendente ou vencida: preservar.
- Cobrança paga e recibo: preservar.
- Chamado aberto ou encerrado: preservar.
- Status da matrícula: preservar.
- Faculdade e dados cadastrais: preservar.
- Arquivar novamente: não incrementar indefinidamente a versão do token.

Na primeira transição para arquivado, revogar o acesso existente. Se um registro já arquivado apresentar acesso ativo por inconsistência, a operação deverá corrigir o acesso e revogar suas sessões. Repetir a operação quando cadastro e acesso já estiverem no estado correto não produz nova revogação.

Não aguardar SMTP nem executar chamadas externas dentro dessa transação.

## 6. Restauração e segurança de acesso

Ao restaurar:

- Definir somente `arquivado=false`.
- Manter usuário desativado.
- Não recuperar sessões antigas.
- Não alterar senha ou e-mail.
- Não apagar o histórico.
- Não criar cobrança imediatamente.

Para voltar a acessar e receber e-mails, o administrador precisará reativar a conta separadamente na tela Usuários. Se não houver conta, poderá criá-la depois da restauração.

### 6.1 Proteções contra reativação indevida

Atualizar os fluxos de usuários para:

- Não listar alunos arquivados em “pessoas sem usuário” disponíveis para novos acessos.
- Rejeitar criação de conta para aluno arquivado.
- Rejeitar `ativo=true` enquanto o aluno estiver arquivado, inclusive quando o acesso já estiver indevidamente ativo.
- Permitir manutenção administrativa de e-mail e senha sem reativar o acesso.
- Permitir exclusão somente do acesso, preservando o aluno e seu arquivamento.

Utilizar conflito de negócio `409`, com orientação para restaurar primeiro o cadastro, nas tentativas de criar/reativar acesso de arquivado.

A autenticação e a validação JWT também devem rejeitar aluno arquivado, mesmo se `Usuario.ativo` estiver inconsistente. Manter as respostas de autenticação seguras e o tratamento global de `401`.

### 6.2 Atualização comum do cadastro

O endpoint comum de atualização de aluno não poderá arquivar/restaurar por cópia de propriedades. Preservar o campo em atualizações e utilizar exclusivamente o PATCH dedicado.

Revisar usos de `BeanUtils.copyProperties`, DTOs e caminhos genéricos de atualização de pessoa. Dados de entrada não podem desarquivar um cadastro por ausência de campo ou por valor padrão.

A edição administrativa dos dados existentes pode continuar disponível, mas não deve gerar uma nova cobrança para um arquivado. O método de atualização não deve chamar geração automática de primeira conta nesse caso.

## 7. Exclusão definitiva protegida

Executar em uma única transação:

1. Buscar e bloquear o aluno.
2. Confirmar que está arquivado.
3. Consultar novamente todos os vínculos.
4. Bloquear se houver qualquer impedimento.
5. Remover o acesso vinculado, se existir.
6. Excluir o aluno.
7. Executar `flush` antes de concluir.
8. Confirmar a transação.

### 7.1 Vínculos impeditivos

| Vínculo | Referência | Tratamento |
|---|---|---|
| Contas a receber | `conta_receber.aluno_id` | Bloquear, qualquer estado |
| Contas a pagar | `conta_pagar.pessoa_id` | Bloquear, inclusive vínculos antigos inconsistentes |
| Chamados | `chamado_manutencao.responsavel_id` | Bloquear, qualquer estado |
| Viagens | `viagem.motorista_id` | Bloquear se referenciar aquela pessoa, mesmo em dados inconsistentes |
| Usuário | `usuario.pessoa_id` | Remover acesso na mesma transação |
| Histórico de e-mail | Identificadores históricos sem FK de usuário | Preservar |

Não excluir cobranças para “destravar” o cadastro. Mesmo cobranças nunca pagas são impedimentos nesta política.

A existência de recebimento também protege o histórico por meio da conta a receber à qual ele pertence. Não remover recibos ou recebimentos indiretamente.

### 7.2 Caminhos alternativos e falhas

A mesma proteção deve ser utilizada por qualquer caminho de exclusão de `Pessoa` que alcance um aluno. Não permitir que um endpoint genérico contorne a regra.

Centralizar as verificações e a exclusão para não manter políticas divergentes entre `AlunoService` e `PessoaService`.

Se surgir uma relação entre a verificação e o DELETE, a chave estrangeira continua sendo a última proteção. Fazer rollback completo e retornar conflito seguro, nunca sucesso parcial.

Não capturar uma falha de constraint para continuar usando a mesma transação já inválida. A tradução da exceção deve ocorrer após rollback, ou pela camada de tratamento adequada. Se não for possível obter contagens atualizadas com segurança, retornar mensagem de relacionamento bloqueado, sem fabricar números.

Uma segunda chamada DELETE para um aluno já excluído retorna `404`. Não realizar repetição automática de exclusões.

## 8. Cobranças, pagamentos e recorrência

### 8.1 Cobranças existentes

Continuam disponíveis nas consultas administrativas, inclusive quando o aluno estiver arquivado.

Não modificar:

- Valor.
- Vencimento.
- Estado financeiro.
- Recebimentos.
- Recibos.
- Totais de contas abertas ou vencidas.

Arquivamento não representa cancelamento de dívida.

### 8.2 Novas cobranças

A rotina `RotinaFinanceiraService` deverá selecionar somente alunos não arquivados.

Também proteger os métodos que geram cobranças diretamente:

- Primeira cobrança.
- Primeira cobrança quando ausente.
- Próxima cobrança recorrente.
- Criação/alteração administrativa que atribua uma nova cobrança a aluno arquivado.

Rejeitar novos vínculos financeiros para arquivados com erro de negócio explícito. Consultar ou manter histórico existente não será bloqueado.

Uma alteração de cobrança que troque seu aluno também é criação de novo vínculo para o aluno de destino e precisa ser validada. Uma edição que preserve o proprietário e mantenha o histórico não deve ser rejeitada apenas pelo arquivamento.

A seleção inicial da rotina não é suficiente contra concorrência: revalidar o estado sob o bloqueio do aluno antes de gerar cada cobrança.

### 8.3 Pagamento pessoal

Antes de concluir um pagamento:

- Verificar propriedade da cobrança.
- Verificar que o aluno não está arquivado.
- Manter prevenção de pagamento duplicado.
- Impedir que o pagamento altere a matrícula ou produza recebimento após arquivamento confirmado.

A validação de propriedade deve continuar ocultando cobranças de outros alunos. Não revelar o estado de arquivamento de terceiros por mensagens de erro.

### 8.4 Após restauração

- A restauração em si não cria cobranças.
- A rotina posterior retoma a regra atual baseada na última conta e no intervalo de 30 dias.
- Esta entrega não redefine vencimentos nem elimina lacunas anteriores. Essa regra deve ficar explícita na documentação para não prometer reinício automático de um novo período financeiro.

Em particular, a rotina atual pode produzir uma próxima conta com vencimento antigo quando a última conta está muito atrasada. O arquivamento não modifica essa regra; uma mudança para reiniciar o ciclo a partir da restauração exigiria outra decisão de negócio.

## 9. E-mails

Atualizar duas verificações:

1. Seleção de associados em `EmailRepository`.
2. Elegibilidade imediatamente antes do envio em `EmailFilaService`.

Para alunos, exigir:

- Conta ativa.
- Cadastro não arquivado.
- E-mail válido.
- Permissão do modo de teste, quando aplicável.

Motoristas e administradores manterão as regras existentes. Isso não inclui administradores no público: ADMIN continua excluído da programação geral.

### 9.1 Entregas já enfileiradas

- Entregas ainda não enviadas deverão ser suprimidas quando o worker identificar o aluno arquivado.
- Preservar lote, conteúdo congelado, tentativas e histórico.
- Reutilizar o estado `SUPRIMIDA` e a indicação segura de alteração/inativação cadastral existente (`CONTA_OU_EMAIL_ALTERADO`).
- Não reenviar automaticamente depois da restauração.
- Não alterar as regras atuais de requestId, revisão e duplicidade diária.
- Não marcar como entregue uma mensagem apenas aceita pelo SMTP.

A revalidação precisa consultar o estado atual do cadastro; não depender somente do `ativo` registrado no momento em que o lote foi criado.

### 9.2 Limite técnico

Arquivar não consegue recolher mensagens já enviadas ou aceitas pelo SMTP.

Também existe uma pequena janela entre a última verificação de elegibilidade e a chamada externa. Não manter locks de banco durante SMTP para tentar eliminar essa janela; documentar esse limite, sem prometer cancelamento de envio já iniciado.

Nenhuma credencial SMTP será adicionada ao frontend, ao guia ou aos logs de teste. O modo de teste e a configuração atual de destinatários permitidos continuam funcionando.

## 10. Indicadores e consultas

Excluir alunos arquivados de:

- Listagem principal de alunos.
- Indicadores operacionais de alunos do dashboard.
- Contagem de alunos ativos por faculdade usada na capacidade dos ônibus.
- Rotina recorrente de mensalidades.
- Seleção para criação de acesso.
- Seleção de destinatários de e-mail.

Preservar:

- Consultas administrativas de contas e recebimentos.
- Valores recebidos e pagos.
- Pendências financeiras.
- Recibos.
- Chamados e seus solicitantes.
- Programação geral de viagens e faculdades.

Não remover uma faculdade ou viagem da programação porque um aluno foi arquivado. O arquivamento afeta o associado, não a existência da rota.

Manter o contrato atual dos indicadores: total e categorias de matrícula serão calculados sobre não arquivados. Não adicionar arquivados à categoria de matrícula inativa, pois são conceitos distintos. A consulta dos arquivados estará disponível no filtro administrativo.

## 11. Concorrência e consistência

Utilizar o aluno como ponto comum de sincronização para arquivamento, restauração, exclusão, criação/reativação de acesso, geração de cobranças e pagamento pessoal.

Ordem de aquisição:

1. Aluno/pessoa.
2. Usuário vinculado, quando necessário.
3. Cobrança ou outro registro dependente.

Operações que alterem mais de um aluno devem bloquear os IDs em ordem crescente.

O pagamento atual bloqueia primeiro a cobrança. Adaptar esse fluxo para identificar o aluno, bloquear o aluno e depois bloquear/revalidar a cobrança, evitando inversão de ordem com o arquivamento. A leitura inicial serve somente para descobrir o proprietário; os dados e a propriedade precisam ser verificados novamente sob os locks.

Regras adicionais:

- Não manter locks durante chamadas externas.
- Não implementar retries automáticos que repitam uma operação destrutiva.
- Não confiar na consulta de prévia de exclusão.
- Não confiar somente na validação do frontend.
- Proteger novos vínculos nos serviços responsáveis e manter as FKs como última defesa.
- Em exclusão ou arquivamento malsucedido, não deixar o acesso removido/desativado parcialmente.
- Evitar objetos de aluno carregados antes do bloqueio sobrescreverem o estado atual de arquivamento.

Resultados esperados para disputas:

| Disputa | Garantia |
|---|---|
| Arquivar × pagamento | Se arquivamento concluir primeiro, pagamento não prossegue; se pagamento concluir primeiro, seu histórico é preservado pelo arquivamento posterior |
| Arquivar × nova cobrança | Não gerar cobrança após o arquivamento confirmado |
| Arquivar × reativação de usuário | Não deixar acesso ativo para aluno arquivado |
| Excluir × novo vínculo | Ou a exclusão conclui primeiro e o novo vínculo falha, ou o vínculo persiste e bloqueia a exclusão |
| Arquivar × SMTP iniciado | Sem promessa de recolhimento de envio externo já iniciado |

## 12. Integração esperada com o frontend

O frontend deverá:

- Mostrar não arquivados por padrão.
- Disponibilizar filtro de arquivados e todos.
- Utilizar Arquivar como ação principal.
- Informar que acesso e novos envios serão interrompidos, mas dívidas permanecerão.
- Oferecer restauração sem promessa de reativação da conta.
- Consultar impedimentos antes da exclusão definitiva.
- Atualizar a tela somente após resposta de sucesso.
- Manter os tratamentos globais de conexão, autenticação e autorização, sem toasts duplicados.

Não será criado endpoint de exclusão definitiva em lote.

O arquivamento em lote utilizará chamadas individuais sequenciais ao PATCH. Cada aluno terá sua própria transação; o frontend apresentará resultados parciais e não poderá anunciar sucesso para itens que falharam.

O botão atual que apenas remove linhas em memória não deve continuar sendo apresentado como exclusão persistida.

### Alterações de compatibilidade para comunicar

- `GET /aluno/listar` passa a ocultar arquivados por padrão.
- A resposta de aluno ganha `arquivado`.
- DELETE passa a exigir arquivamento prévio e retorna `204` quando concluir.
- Conflitos passam a fornecer motivos estruturados e contagens quando disponíveis.
- Restaurar cadastro e reativar conta são ações distintas.

Entregar o backend antes da interface que utiliza os novos contratos. Não simular arquivamento em storage local para contornar ausência das APIs.

## 13. Testes obrigatórios

Utilizar dados isolados e gateways simulados. Nunca executar estes cenários sobre os alunos reais ou com envio SMTP real.

### 13.1 Arquivamento e restauração

- Arquivar aluno com e sem acesso.
- Desativar acesso e invalidar JWT anterior.
- Repetir arquivamento sem efeitos duplicados.
- Corrigir acesso indevidamente ativo de aluno já arquivado.
- Restaurar mantendo acesso desativado.
- Repetir restauração sem efeitos extras.
- Preservar status da matrícula e todos os registros históricos.
- Impedir edição comum de contornar o campo `arquivado`.
- Editar dados de arquivado sem gerar cobrança automática.
- Garantir rollback completo em falhas.

### 13.2 APIs e exclusão

- Listar não arquivados por padrão, arquivados e todos.
- Retornar `[]` quando o filtro não tiver resultados.
- Rejeitar situação inválida e corpo de arquivamento ausente/nulo/inválido.
- Consultar impedimentos com contagens de todos os estados.
- Excluir arquivado sem vínculos, com e sem acesso.
- Bloquear aluno não arquivado.
- Bloquear cada vínculo separadamente.
- Bloquear cobrança paga, pendente e vencida.
- Bloquear chamado encerrado e aberto.
- Preservar histórico de e-mails após exclusão.
- Aplicar as mesmas regras ao caminho genérico de exclusão de pessoa.
- Revalidar quando aparecer vínculo após a consulta de situação.
- Confirmar `204` sem corpo e `404` para inexistente/já excluído.
- Confirmar que erros não expõem informações internas do banco.

### 13.3 Segurança e operação

- ADMIN permitido; ALUNO/MOTORISTA proibidos.
- Sem autenticação: `401`.
- Criar ou reativar acesso para arquivado: bloqueado.
- Login e JWT rejeitados mesmo com usuário indevidamente ativo.
- Redefinir senha/alterar e-mail não reativa acesso.
- Recorrência não gera contas para arquivados.
- Métodos diretos e atribuição administrativa de nova cobrança também são protegidos.
- Pagamento concorrente não reativa aluno arquivado.
- Dashboard e capacidade desconsideram arquivados.
- Financeiro continua incluindo seu histórico.
- Prévia e envio de e-mails ignoram arquivados.
- Worker suprime destinatário arquivado após enfileiramento.
- Restaurar não reenfileira mensagens suprimidas.
- Não utilizar SMTP real nos testes.

### 13.4 Banco

- Testar migração em PostgreSQL com dados anteriores.
- Confirmar que registros antigos recebem `arquivado=false`.
- Verificar defaults para todos os subtipos de pessoa.
- Confirmar que nenhuma relação financeira ganhou exclusão em cascata.
- Executar testes concorrentes relevantes em PostgreSQL; H2 isoladamente não comprova comportamento de locks e FKs em produção.
- Validar que falhas de exclusão também revertem a remoção do acesso.

## 14. Ordem de implementação e aceite

### 14.1 Sequência

1. Preservar as alterações existentes nos dois projetos.
2. Implementar migração e campo.
3. Criar consultas e serviço central de arquivamento/exclusão.
4. Implementar APIs, validação e autorização.
5. Proteger usuários, autenticação e caminhos genéricos.
6. Adaptar cobranças, pagamento, recorrência, indicadores e e-mails.
7. Implementar testes automatizados.
8. Executar a suíte Maven e os testes PostgreSQL disponíveis.
9. Atualizar a documentação do backend.
10. Entregar os contratos para integração do frontend.

### 14.2 Critérios de aceite

- O administrador consegue retirar um aluno da lista principal sem apagar seu histórico.
- O aluno arquivado perde acesso e não participa de novos envios nem cobranças recorrentes.
- Restaurar não reativa a conta.
- Exclusão definitiva acontece somente sem vínculos impeditivos.
- Conflitos apresentam mensagens compreensíveis.
- Não existe sucesso parcial dentro da operação de um aluno.
- Guias recebidos e diagrama permanecem intactos.
- A documentação distingue testes executados, testes não executados e homologações manuais pendentes.

### 14.3 Registro de validação

Na criação deste guia foi realizada leitura estática dos fluxos existentes. Não foram executados testes da implementação de arquivamento, pois ela ainda não foi realizada.

Após implementar, registrar comandos, resultados, quantidade de testes, testes ignorados, limitações do ambiente e confirmação de migração PostgreSQL. Não declarar homologação com base apenas em compilação ou testes H2.

Esta especificação não autoriza arquivar ou excluir alunos reais, ativar envio automático, executar SMTP real ou realizar commit/push durante a implementação.
