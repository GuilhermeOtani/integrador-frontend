# WhatsApp individual — implementação frontend

## 1. Entrega e referência

Implementado em 14/10/2026 conforme GUIA_WHATSAPP_FRONTEND.md e contratos conferidos nos controllers/DTOs do backend. Backend, guia e diagrama de classes não foram alterados. Não há novas dependências, chamadas diretas à Meta nem alterações dos CRUDs existentes além do atalho de Grades.

ALUNO recebe programação relacionada à faculdade cadastrada; MOTORISTA recebe suas atribuições. O backend escolhe a grade do dia da semana e produz/envia o PDF, sem utilizar datas antigas de viagem. Ausência de programação não gera aviso ou documento vazio. Matrícula pendente/inativa não substitui a regra de conta ativa. Ônibus indisponível aparece com aviso, sem cancelamento automático.

Não existe envio para grupo, WhatsApp Web, chatbot, agendamento no navegador, data arbitrária de envio ou formulário de segredos.

## 2. Organização

```text
src/app/components/whatsapp/
├── models/whatsapp.models.ts
├── service/whatsapp-service.ts
├── utils/
│   ├── whatsapp.utils.ts
│   └── atualizacao-limitada.ts
├── testing/whatsapp.fixtures.ts
└── components/
    ├── assinatura-whatsapp/  (TS, HTML, CSS e spec)
    └── whatsapp-admin/       (TS, HTML, CSS e spec)
```

Specs de serviço/utilitários ficam ao lado do arquivo testado. ViagemResumo vem de dashboard/models; UsuarioResumo e JWT permanecem em core/auth. Serviço usa environment.apiUrl, interceptor e guard atuais. Componentes são standalone com signals, formulários reativos, PrimeNG, cores do tema e layout responsivo.

Perfil importa o card somente para ALUNO/MOTORISTA. Rota /whatsapp usa roleGuard(['ADMIN']); sidebar inclui WhatsApp em Logística. Grades inclui link administrativo para a página, sem POST e sem enviar a grade selecionada. Login com retorno interno continua preservado.

## 3. Contratos HTTP

| Método e URL | Operação |
|---|---|
| GET /whatsapp/minha-assinatura | Consultar assinatura pessoal |
| POST /whatsapp/minha-assinatura/ativacao | Corpo { numero, aceite } |
| DELETE /whatsapp/minha-assinatura | Cancelar, sem corpo |
| GET /whatsapp/minha-programacao/pdf | Documento pessoal, Blob |
| GET /integracoes/whatsapp/configuracao | Flags operacionais sem segredos |
| PUT /integracoes/whatsapp/configuracao | Corpo { automatico } |
| GET /integracoes/whatsapp/previa | Query usuarioId administrativa |
| GET /integracoes/whatsapp/previa/pdf | Query usuarioId, Blob |
| POST /integracoes/whatsapp/envios | Corpo { requestId, publico, reenviar, motivo } |
| GET /integracoes/whatsapp/envios | Queries pagina e tamanho |
| GET /integracoes/whatsapp/envios/{id} | Detalhes do lote |

Tipos preservam nulos, números de telefone como strings e UUID como string. Assinatura contém número, estado e timestamps de consentimento/confirmação/cancelamento/expiração. Configuração contém habilitação, modo, automático, credenciais/webhook/template, horário, fuso, recuperação e número do sistema — nunca token.

Programação contém dataReferencia, diaSemana, papel, referencia e viagens. Prévia acrescenta usuarioId, nome, elegivel e impedimentos. Lote contém identificação, data, origem, público, reenvio, motivo, criadoEm, ignoradosDuplicidade, totais e entregas. Histórico contém itens, pagina, tamanho, total e totalPaginas.

Estados de assinatura: NAO_CADASTRADA, PENDENTE, ATIVA, CANCELADA. Públicos: TODOS, ALUNOS, MOTORISTAS. Origem: MANUAL/AUTOMATICA. Entregas: PENDENTE, PROCESSANDO, ACEITA, ENVIADA, ENTREGUE, LIDA, FALHA, INCERTA, SUPRIMIDA, EXPIRADA. O request usa reenviar; resposta usa reenvio.

Endpoints pessoais não enviam pessoaId/usuarioId. O backend identifica a pessoa pelo JWT. Apenas prévias administrativas recebem usuarioId.

## 4. Assinatura e consentimento

Ao entrar no perfil, consultar assinatura. Número obrigatório é normalizado removendo espaços, parênteses e hífens, com máximo de 40 caracteres de entrada e formato internacional aceito pelo backend (+, país sem zero inicial e 8–15 dígitos). Aceite começa falso e é obrigatório; não é preenchido pelo telefone existente.

Após solicitar, exibir o link exato retornado, somente se HTTPS/wa.me, com target blank e noopener/noreferrer. Não abrir automaticamente nem extrair código. Usuário precisa enviar a mensagem no WhatsApp; somente o webhook altera ATIVA. Nunca persistir link/código em storage, logs ou analytics.

PENDENTE mostra número, prazo retornado (30 minutos) e Atualizar situação. GET não recupera link após recarga; nova solicitação é explícita e invalida códigos antigos. Limite de cinco solicitações/hora é informado; backend permanece autoridade. Trocar número exige novo aceite/confirmação e suspende o anterior.

Cancelamento exige diálogo explícito, usa DELETE, limpa link após sucesso e consulta novamente assinatura. Também pode ocorrer por SAIR/PARAR/CANCELAR no WhatsApp. Não recolhe mensagens antigas. Falhas mantêm informações digitadas; 400 associa errors aos controles conhecidos, 409 informa conflito e nenhum POST é repetido automaticamente.

PDF pessoal pode ser baixado sem assinatura ativa. GET autenticado retorna Blob; URL temporária é criada somente para download e revogada depois. 404 não gera documento vazio.

## 5. Painel ADMIN

### Configuração e automático

Cards mostram teste/produção, integração, credenciais, webhook e template. Estado pendente informa Aguardando configuração da Meta; não há campos de segredo. Prévia/histórico continuam disponíveis, mas novo envio e ativação automática são bloqueados enquanto não estiver pronta.

Chave não altera estado antecipadamente: PUT bem-sucedido substitui configuração; falha mantém anterior. Desativar permanece permitido mesmo sem configuração pronta. Backend agenda 15h America/Sao_Paulo, recuperando o dia após 15h e antes das 18h. Backend precisa permanecer ligado; Angular fechado não interfere. Desativar não cancela lotes já registrados.

### Prévia

Seletor usa GET /usuarios e filtra somente ALUNO/MOTORISTA, inclusive contas inativas para explicar impedimentos. Busca por nome/e-mail/papel. A troca cancela GET anterior e limpa dados/erros; uma leitura assíncrona de erro PDF antigo não contamina novo destinatário.

Mostrar data, dia e referência retornados, elegibilidade e impedimentos traduzidos (CONTA_INATIVA, WHATSAPP_NAO_CONFIRMADO, NUMERO_FORA_DA_LISTA_DE_TESTE, SEM_FACULDADE, SEM_PROGRAMACAO). Cada viagem tem detalhes expansíveis: ocorrência, ônibus/placa/modelo/capacidade/estado, motorista, grade, rota, pontos ordenados, faculdades/endereços e avisos. Dados completos vêm do backend, não de vários CRUDs.

Download da prévia independe de assinatura ativa e está bloqueado quando não há viagens. Elegibilidade do destinatário não equivale à disponibilidade da integração.

### Envios e idempotência

Envio normal exige diálogo de confirmação e público, inicialmente TODOS. Atualização é ação separada: motivo obrigatório até 500 caracteres, não somente espaços, com aviso de nova mensagem sem apagar anterior. Gerar requestId por intenção com crypto.randomUUID(); normal envia reenviar=false/motivo=null.

Bloquear clique duplo, mudanças no formulário e fechamento durante POST. HTTP 202 mostra Lote registrado para processamento; recarregar histórico e consultar detalhes. Não afirmar entrega pelo retorno do POST.

Status 0/5xx mantém UUID/corpo em memória e bloqueia alteração de parâmetros. Consultar lote por esse ID e histórico; oferecer Retomar mesma operação com UUID original, sem retry automático. Se o lote for encontrado, encerrar intenção sem novo POST. 404 na consulta não prova que a requisição original jamais será registrada: uma nova tentativa continua usando o mesmo ID. Não recarregar/sair antes de conferir, pois a intenção não é persistida. Backend também protege envio normal diário por destinatário.

### Histórico e entregas

Paginação do servidor inicia em zero/20 registros; opções 20, 50, 100. first/rows calculam página; mudar tamanho retorna a zero. Sem ordenação local enganosa do histórico completo. Atualizar permanece manual.

Detalhes mostram todos os totais, inclusive zero, duplicidades ignoradas, nome, número mascarado, revisão, tentativas, estado e diagnóstico seguro. ACEITA é aceite da Meta, ENVIADA/ENTREGUE/LIDA dependem de webhook. INCERTA não dispara reenvio automático. SUPRIMIDA é ausência de envio por regra, não entrega. Lista vazia é distinta de erro.

## 6. Polling, datas e erros

AtualizacaoLimitada faz apenas GET a cada cinco segundos, por no máximo dez minutos, sem sobreposição, cancelando GET pendente ao encerrar. Assinatura usa também o prazo do código e encerra ao deixar PENDENTE. Lote acompanha PENDENTE/PROCESSANDO/ACEITA/ENVIADA e encerra nos demais estados. Erro, fechamento e destruição param o acompanhamento. Há botões para atualizar manualmente.

LocalDate usa DatePipe UTC; timestamps usam America/Sao_Paulo. Textos e avisos são interpolados, nunca HTML do backend. Downloads não colocam JWT na URL nem disponibilizam links públicos.

| Erro | Comportamento |
|---|---|
| 400 | Preservar dados, mostrar validação e associar errors conhecidos aos controles |
| 401/403 | Interceptor existente encerra sessão/navega para Sem permissão |
| 404 | Informar ausência de recurso/documento; não inventar resposta vazia bem-sucedida |
| 409 | Mostrar conflito e manter dados para revisão |
| 503 | Integração indisponível/configuração; manter chave anterior |
| 0/5xx no POST | Resultado incerto, preservar intenção e verificar lote antes de repetir |

ProblemDetail em Blob é convertido para mensagem segura. Avisos globais não são duplicados em toast local. Nenhum PDF, credencial ou código é enviado/armazenado pela UI fora do fluxo explícito.

## 7. Validação e resultados

- Baseline: 209/209 testes antes das alterações.
- Final: 259/259 testes aprovados em 56 specs, incluindo 50 testes adicionais.
- TypeScript aplicação/testes: aprovado.
- Build Angular de produção: aprovado sem avisos; inicial 1,09 MB / 192,76 kB estimados de transferência.
- Novas dependências: nenhuma.

Testes cobrem serviços/métodos/corpos, consentimento/número, estados, confirmação/cancelamento, limites/polling/expiração/destruição, Blob/download, UUID/reenvio, erros e preservação, integração indisponível, automático, paginação, troca de destinatário, zeros, máscaras, menu/guards/perfil e atalho de Grades.

No navegador: /whatsapp sem sessão redirecionou para login com retorno. Após login ADMIN pelo usuário, configuração real consultada está desativada/em teste, sem credenciais/webhook/template. Prévias de ALUNO e MOTORISTA retornaram programação de 14/10, com WhatsApp não confirmado; histórico vazio. Conferido em 1440px e 360px no modo escuro: documento/main sem overflow horizontal, tabelas com rolagem interna. Nenhum envio/ativação/cancelamento/PUT automático foi executado.

Pendentes: revisão visual do card pessoal com login real, modo claro, PDF real, confirmação pelo telefone, webhook, entrega/leitura e automático com Meta configurada. Testes automatizados não equivalem a essas homologações.

## 8. Ativação real, posteriormente

1. Preparar conta/número de teste Meta, template DOCUMENT aprovado com três parâmetros, credenciais externas e webhook HTTPS verificado, conforme o guia.
2. Usar somente números autorizados na lista de teste, sem migrar número pessoal ou presumir gratuidade.
3. Aluno/motorista confirma assinatura pelo telefone; conferir prévia e PDF.
4. ADMIN confirma lote manual pequeno; verificar estados por webhook e recebimento no telefone.
5. Somente depois ativar automático; validar rotina às 15h e recuperação antes das 18h com backend hospedado.

Não foram configuradas credenciais nem enviados dados para a Meta durante esta implementação. DOCUMENTACAO_APLICACAO.md registra entrega, contratos, testes e pendências; o guia recebido permanece intacto.
