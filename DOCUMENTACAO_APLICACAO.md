# Documentação da Aplicação — Integrador Frontend

## 1. Visão geral

O **Integrador Frontend** é uma SPA administrativa para uma operação de transporte universitário. A aplicação foi desenvolvida com Angular, usa componentes standalone e consome uma API REST cuja URL está centralizada em `src/environments/environment.ts`.

O sistema possui autenticação JWT e três papéis:

- `ADMIN`: administra usuários e acessa todos os módulos existentes;
- `ALUNO`: consulta rotas, pontos de embarque e grades diárias;
- `MOTORISTA`: consulta o próprio perfil e suas viagens.

Além da autenticação, o frontend oferece cadastro e consulta de alunos, faculdades, ônibus, motoristas, pontos de embarque, rotas e grades diárias, bem como consulta de contas a pagar, pagamento e recibo.

> **Estado da revisão:** o código-fonte foi revisado em 01/09/2026 após a implementação da autenticação. A compilação TypeScript, os 52 testes automatizados e o build de produção foram aprovados. A validação integrada dos três papéis ainda depende de credenciais e dados no backend local.

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
| Chart.js | `^4.5.1` | Dependência disponível para gráficos |
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
│   │   ├── api-error.ts
│   │   ├── auth.guards.ts
│   │   ├── auth.interceptor.ts
│   │   ├── auth.models.ts
│   │   ├── auth.service.ts
│   │   └── usuario.service.ts
│   ├── components/
│   │   ├── login/
│   │   ├── perfil/
│   │   ├── sem-permissao/
│   │   ├── usuarios/
│   │   ├── aluno/
│   │   ├── faculdade/
│   │   ├── onibus/
│   │   ├── motorista/
│   │   ├── ponto-embarque/
│   │   ├── rota/
│   │   ├── grade-diaria/
│   │   ├── viagem/
│   │   ├── conta-pagar/
│   │   └── sidebar/
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.ts
└── environments/
    └── environment.ts
```

As páginas são carregadas com `loadComponent`, reduzindo o bundle inicial por lazy loading. Os módulos CRUD antigos mantêm o padrão modelo + serviço + listagem + cadastro.

---

## 4. Autenticação e autorização

### Sessão

`AuthService` mantém a sessão em um signal e persiste apenas na aba atual pelo `sessionStorage`, sob a chave:

```text
integrador.sessao
```

A sessão contém o access token, o tipo `Bearer`, o instante absoluto de expiração e o resumo do usuário. Na inicialização, o JSON armazenado é validado; conteúdo inválido, papel desconhecido ou sessão expirada são descartados.

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
| `ADMIN` | `/alunos` |
| `ALUNO` | `/rotas` |
| `MOTORISTA` | `/minhas-viagens` |

---

## 5. Rotas e menus por papel

| URL | Acesso | Finalidade |
|---|---|---|
| `/login` | Pública, apenas visitante | Autenticação |
| `/perfil` | Autenticado | Dados de `/auth/me` |
| `/sem-permissao` | Autenticado | Aviso de acesso negado |
| `/usuarios` | `ADMIN` | Administração de contas |
| `/alunos` | `ADMIN` | CRUD de alunos |
| `/faculdades` | `ADMIN` | CRUD de faculdades |
| `/onibus` | `ADMIN` | CRUD de ônibus |
| `/motoristas` | `ADMIN` | CRUD de motoristas |
| `/contapagar` | `ADMIN` | Contas, pagamentos e recibos |
| `/rotas` | `ADMIN`, `ALUNO` | Rotas e itinerários |
| `/pontosembarque` | `ADMIN`, `ALUNO` | Pontos de embarque |
| `/grades` | `ADMIN`, `ALUNO` | Grades diárias e viagens |
| `/minhas-viagens` | `MOTORISTA` | Viagens do motorista autenticado |

`/onibuss` foi mantida como redirecionamento de compatibilidade para `/onibus`. A raiz e URLs desconhecidas redirecionam para `/perfil`.

A sidebar calcula os itens pelo papel, exibe nome, papel e iniciais reais do usuário e executa o logout. Ela fica invisível no login e sempre que não existe sessão.

Para `ALUNO`, rotas, grades e pontos ficam em modo de leitura: botões de criar, importar, excluir em massa, editar e excluir não são renderizados. Pesquisa, paginação, exportação e detalhes continuam disponíveis.

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
- criar outro administrador.

Os formulários usam e-mail, senha entre 8 e 72 caracteres e confirmação local. Em `409`, o diálogo permanece aberto e mostra o conflito de e-mail ou pessoa. Após uma criação bem-sucedida, as listas de contas e pessoas disponíveis são atualizadas.

### Minhas viagens

A página chama somente `GET /viagem/minhas`; o frontend não envia `motoristaId`. Ela apresenta data, rota, ônibus e faculdades, além dos estados de carregamento, lista vazia e erro.

---

## 7. Módulos administrativos existentes

### Cadastros principais

- **Alunos:** dados pessoais, matrícula, status, mensalidade e faculdade;
- **Faculdades:** nome, endereço e telefone;
- **Ônibus:** identificação, placa, modelo, capacidade, status e foto em Data URL/base64;
- **Motoristas:** dados pessoais, CNH e salário;
- **Pontos de embarque:** descrição e ordem de parada;
- **Rotas:** nome, descrição, faculdade e sequência de pontos;
- **Grades diárias:** data, descrição e viagens aninhadas com rota, ônibus, motorista e faculdades.

### Contas a pagar

A interface lista contas, separa pagas das pendentes/atrasadas, realiza pagamento e consulta recibo. O serviço possui atualização de conta, mas a tela não oferece CRUD completo de contas.

### Limitações legadas ainda existentes

- os botões de importação de alguns cadastros são apenas visuais;
- a exclusão em massa remove itens apenas da tabela local e não envia todos os `DELETE` ao backend;
- parte dos formulários legados usa validação visual/incompleta, sem formulário reativo;
- máscaras de CPF/CNPJ e CNH não validam dígitos verificadores;
- o componente `Dashboard` continua como placeholder sem rota;
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
| GET | `/viagem/minhas` | `Viagem[]` do token autenticado |

Papéis aceitos: `ADMIN`, `ALUNO` e `MOTORISTA`.

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

---

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

Em 01/09/2026 foram validados:

| Verificação | Resultado |
|---|---|
| TypeScript da aplicação | Aprovado |
| TypeScript dos testes | Aprovado |
| Karma + Chrome Headless | **52/52 aprovados** |
| Build Angular de produção | Aprovado |
| Bundle inicial | `1,08 MB` bruto; `193,97 kB` estimados para transferência |

Durante a instalação, o npm informou 17 alertas na árvore de dependências (2 baixos, 2 moderados e 13 altos). Nenhum `npm audit fix` foi aplicado automaticamente, pois a atualização deve ser analisada separadamente para evitar alterações incompatíveis.

A cobertura adicionada contempla:

- login, armazenamento, restauração inválida, sessão expirada, temporizador, logout e papéis;
- interceptor para API, login sem token, `401`, `403` e status `0`;
- guards para visitante e cada papel;
- login inválido, backend indisponível e redirecionamento pós-login;
- endpoints do serviço de usuários;
- `GET /viagem/minhas` sem identificação do motorista;
- correção dos imports quebrados dos specs de faculdade e ponto;
- atualização do teste obsoleto do componente raiz.

Os specs legados de componentes continuam majoritariamente como testes básicos de criação. Ampliar a cobertura de cada CRUD, validação e payload continua recomendado.

---

## 12. Validação integrada recomendada

Com o backend real ativo:

1. entrar como administrador e conferir todos os menus e CRUDs;
2. criar um aluno e um motorista de teste;
3. em `/usuarios`, criar as contas vinculadas;
4. entrar com cada conta e validar os três menus;
5. confirmar que aluno consulta apenas rotas, pontos e grades e não vê ações de escrita;
6. confirmar que motorista acessa apenas perfil e próprias viagens;
7. recarregar a página e validar a restauração da sessão;
8. testar logout, token expirado, URL proibida e token inválido;
9. testar conflitos de e-mail/pessoa (`409`);
10. pausar o backend com segurança e validar o status `0`.

Os registros criados permanecem no banco porque não existe endpoint de exclusão de usuários.

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
| API centralizada por environment | Implementado para desenvolvimento |
| Autenticação JWT e expiração automática | Implementado |
| Interceptor e guards | Implementado |
| Menus por papel | Implementado |
| Perfil, usuários e minhas viagens | Implementado |
| CRUDs administrativos existentes | Mantidos para `ADMIN` |
| Leitura de rotas, pontos e grades | Disponível para `ALUNO` |
| Testes automatizados | 52 aprovados |
| Build de produção | Aprovado |
| Teste integrado dos três papéis | Pendente de execução com credenciais reais |
| Importação e exclusão em massa persistente | Não implementadas |
| Ambiente de produção | URL ainda não definida |

---

**Última revisão:** 1º de setembro de 2026

**Versão do pacote:** 0.0.0

**Status:** autenticação implementada e build validado; resta a homologação manual com o backend real.
