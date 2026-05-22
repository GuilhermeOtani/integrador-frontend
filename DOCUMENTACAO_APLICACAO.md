# 📚 Documentação Completa - Integrador Frontend

## 1. Visão Geral da Aplicação

**Integrador Frontend** é uma aplicação web moderna desenvolvida em **Angular 21** que funciona como interface administrativa para gerenciar dados de uma instituição educacional de transporte. A aplicação permite gerenciar:

- ✅ **Alunos** - Cadastro, listagem, edição e exclusão de alunos
- ✅ **Faculdades** - Gerenciamento de instituições de ensino
- ✅ **Ônibus** - Gestão de veículos e sua frota
- ✅ **Motoristas** - Cadastro e gerenciamento de motoristas
- ✅ **Contas a Pagar** - Controle de pagamentos e faturas

---

## 2. Tecnologias Utilizadas

### Frontend Framework
- **Angular**: v21.2.3 - Framework principal para construção da UI
- **TypeScript**: Linguagem de programação fortemente tipada
- **RxJS**: v7.8.0 - Programação reativa para gerenciamento de streams de dados

### UI Components & Styling
- **PrimeNG**: v21.1.3 - Biblioteca de componentes UI rico
- **PrimeFlex**: v4.0.0 - Sistema de grid baseado em flexbox
- **PrimeIcons**: v7.0.0 - Ícones vetoriais
- **Tailwind CSS**: v4.2.1 - Framework CSS utilitário
- **Autoprefixer**: v10.4.27 - Compatibilidade com navegadores antigos

### Testing
- **Jasmine**: v5.9.0 - Framework de testes unitários
- **Karma**: v6.4.0 - Test runner
- **Karma Chrome Launcher**: v3.2.0 - Suporte para Chrome nos testes

### Build & Development
- **Angular CLI**: v21.2.2 - Ferramenta de linha de comando
- **Angular Build**: v21.2.2 - Ferramenta de build
- **Angular Compiler CLI**: v21.2.3 - Compilador

### HTTP & Comunicação
- **@angular/platform-browser**: v21.2.3 - Plataforma de navegador
- **HttpClient**: Para requisições HTTP com o backend

---

## 3. Estrutura do Projeto

```
integrador-frontend/
│
├── src/                          # Código-fonte da aplicação
│   ├── index.html               # HTML principal
│   ├── main.ts                  # Ponto de entrada da aplicação
│   ├── styles.css               # Estilos globais
│   │
│   └── app/                     # Módulo principal da aplicação
│       ├── app.ts               # Componente raiz
│       ├── app.html             # Template do componente raiz
│       ├── app.css              # Estilos do componente raiz
│       ├── app.routes.ts        # Configuração de rotas
│       ├── app.config.ts        # Configuração da aplicação
│       ├── app.spec.ts          # Testes do componente raiz
│       │
│       └── components/          # Componentes da aplicação
│           │
│           ├── aluno/           # Módulo de gerenciamento de alunos
│           │   ├── aluno-service.ts          # Serviço HTTP para alunos
│           │   ├── aluno-service.spec.ts     # Testes do serviço
│           │   ├── model/
│           │   │   └── aluno.ts              # Modelo/Interface Aluno
│           │   ├── aluno-cadastro/           # Componente de cadastro
│           │   │   ├── aluno-cadastro.ts
│           │   │   ├── aluno-cadastro.html
│           │   │   ├── aluno-cadastro.css
│           │   │   └── aluno-cadastro.spec.ts
│           │   └── aluno-listar/             # Componente de listagem
│           │       ├── aluno-listar.ts
│           │       ├── aluno-listar.html
│           │       ├── aluno-listar.css
│           │       └── aluno-listar.spec.ts
│           │
│           ├── faculdade/       # Módulo de gerenciamento de faculdades
│           │   ├── faculdade-service.ts
│           │   ├── faculdade-service.spec.ts
│           │   ├── model/
│           │   │   └── faculdade.ts
│           │   ├── faculdade-cadastro/
│           │   │   ├── faculdade-cadastro.ts
│           │   │   ├── faculdade-cadastro.html
│           │   │   ├── faculdade-cadastro.css
│           │   │   └── faculdade-cadastro.spec.ts
│           │   └── faculdade-listar/
│           │       ├── faculdade-listar.ts
│           │       ├── faculdade-listar.html
│           │       ├── faculdade-listar.css
│           │       └── faculdade-listar.spec.ts
│           │
│           ├── onibus/          # Módulo de gerenciamento de ônibus
│           │   ├── onibus-service.ts
│           │   ├── onibus-service.spec.ts
│           │   ├── model/
│           │   │   └── onibus.ts
│           │   ├── onibus-cadastro/
│           │   │   ├── onibus-cadastro.ts
│           │   │   ├── onibus-cadastro.html
│           │   │   ├── onibus-cadastro.css
│           │   │   └── onibus-cadastro.spec.ts
│           │   └── onibus-listar/
│           │       ├── onibus-listar.ts
│           │       ├── onibus-listar.html
│           │       ├── onibus-listar.css
│           │       └── onibus-listar.spec.ts
│           │
│           ├── motorista/       # Módulo de gerenciamento de motoristas
│           │   ├── motorista-service.ts
│           │   ├── motorista-service.spec.ts
│           │   ├── model/
│           │   │   └── motorista.ts
│           │   ├── motorista-cadastro/
│           │   │   ├── motorista-cadastro.ts
│           │   │   ├── motorista-cadastro.html
│           │   │   ├── motorista-cadastro.css
│           │   │   └── motorista-cadastro.spec.ts
│           │   └── motorista-listar/
│           │       ├── motorista-listar.ts
│           │       ├── motorista-listar.html
│           │       ├── motorista-listar.css
│           │       └── motorista-listar.spec.ts
│           │
│           ├── conta-pagar/     # Módulo de contas a pagar
│           │   ├── conta-pagar.ts             # Componente principal
│           │   ├── conta-pagar.html
│           │   ├── conta-pagar.css
│           │   ├── conta-pagar-service.ts     # Serviço HTTP
│           │   ├── conta-pagar-service.spec.ts
│           │   ├── pagamento-service.ts       # Serviço de pagamentos
│           │   ├── pagamento-service.spec.ts
│           │   ├── model/
│           │   │   └── conta-pagar.ts         # Interface ContaPagar
│           │   └── conta-pagar.spec.ts
│           │
│           └── sidebar/         # Componente de navegação lateral
│               ├── sidebar.ts
│               ├── sidebar.html
│               ├── sidebar.css
│               └── sidebar.spec.ts
│
├── public/                      # Arquivos estáticos públicos
├── angular.json                 # Configuração do Angular CLI
├── package.json                 # Dependências e scripts do projeto
├── tsconfig.json                # Configuração TypeScript base
├── tsconfig.app.json            # Configuração TypeScript da app
├── tsconfig.spec.json           # Configuração TypeScript dos testes
├── tailwind.config.js           # Configuração Tailwind CSS
└── README.md                    # Documentação básica do projeto
```

---

## 4. Componentes Principais

### 4.1 Componente Raiz (App)
**Arquivo**: [src/app/app.ts](src/app/app.ts)

```typescript
- Importa RouterOutlet para renderizar componentes de rota
- Usa PrimeNG PrimeNG config para inicializar ripple effect
- Importa Sidebar para navegação lateral
- Configura módulos: TableModule, ButtonModule, TagModule
```

**Funcionalidades**:
- Renderiza a sidebar de navegação
- Utiliza sistema de roteamento do Angular
- Aplica configurações do PrimeNG (ripple effect)

---

### 4.2 Sidebar (Navegação)
**Arquivo**: `src/app/components/sidebar/`

Componente responsável pela navegação lateral da aplicação. Fornece links para:
- Alunos
- Faculdades
- Ônibus
- Motoristas
- Contas a Pagar

---

### 4.3 Módulo Aluno
**Arquivos**: `src/app/components/aluno/`

#### Estrutura:
- **aluno-listar**: Lista todos os alunos com opções de editar/deletar
- **aluno-cadastro**: Formulário para criar/editar alunos
- **aluno-service**: Serviço HTTP para comunicação com backend

#### Funcionalidades:
- ✅ Listar alunos
- ✅ Cadastrar novo aluno
- ✅ Editar aluno existente
- ✅ Deletar aluno
- ✅ Filtro e busca
- ✅ Integração com faculdades

---

### 4.4 Módulo Faculdade
**Arquivos**: `src/app/components/faculdade/`

#### Funcionalidades:
- ✅ Listar faculdades
- ✅ Cadastrar nova faculdade
- ✅ Editar faculdade
- ✅ Deletar faculdade

---

### 4.5 Módulo Ônibus
**Arquivos**: `src/app/components/onibus/`

#### Funcionalidades:
- ✅ Listar ônibus
- ✅ Cadastrar novo ônibus
- ✅ Editar ônibus
- ✅ Deletar ônibus
- ✅ Gerenciar status do ônibus
- ✅ Upload de foto

---

### 4.6 Módulo Motorista
**Arquivos**: `src/app/components/motorista/`

#### Funcionalidades:
- ✅ Listar motoristas
- ✅ Cadastrar novo motorista
- ✅ Editar motorista
- ✅ Deletar motorista
- ✅ Associar ônibus ao motorista
- ✅ Gerenciar dados de CNH e salário

---

### 4.7 Módulo Contas a Pagar
**Arquivos**: `src/app/components/conta-pagar/`

#### Estrutura:
- **conta-pagar.ts**: Componente principal
- **conta-pagar-service.ts**: Serviço para gerenciar contas
- **pagamento-service.ts**: Serviço para processar pagamentos

#### Funcionalidades:
- ✅ Listar contas a pagar
- ✅ Criar nova conta
- ✅ Editar conta
- ✅ Marcar como paga
- ✅ Filtrar por status (PENDENTE, PAGO, ATRASADO)
- ✅ Integração com motoristas

---

## 5. Modelos de Dados

### 5.1 Aluno
```typescript
export default class aluno {
    id: number;                          // ID único
    nome: string;                        // Nome do aluno
    email: string;                       // Email
    telefone: string;                    // Telefone de contato
    matricula: string;                   // Número de matrícula
    status_matricula: string;            // Status (Ativo, Inativo, Trancado)
    data_cadastro: Date;                 // Data de cadastro no sistema
    cpfCnpj: string;                     // CPF do aluno
    faculdadeId: number;                 // ID da faculdade (FK)
    faculdade: any;                      // Objeto faculdade relacionado
}
```

### 5.2 Faculdade
```typescript
export default class faculdade {
    id: number;                          // ID único
    nome: string;                        // Nome da faculdade/universidade
    endereco: string;                    // Endereço completo
}
```

### 5.3 Ônibus
```typescript
export default class onibus {
    id: number;                          // ID único
    numeroIdentificacao: string;         // Número de identificação
    placa: string;                       // Placa do veículo (ABC-1234)
    modelo: string;                      // Modelo do ônibus
    statusOnibus: string;                // Status (Ativo, Manutenção, Inativo)
    fotoUrl: string;                     // URL da foto do ônibus
    capacidade: number;                  // Capacidade de passageiros
}
```

### 5.4 Motorista
```typescript
export default class motorista {
    id: number;                          // ID único
    nome: string;                        // Nome do motorista
    email: string;                       // Email
    telefone: string;                    // Telefone
    cpfCnpj: string;                     // CPF
    cnh: string;                         // Número da CNH
    salario: number;                     // Salário mensal
    onibusId: number;                    // ID do ônibus associado (FK)
    onibus: onibus;                      // Objeto ônibus relacionado
    numeroIdentificacao: string;         // Número de identificação
}
```

### 5.5 Conta a Pagar
```typescript
export interface ContaPagar {
    id?: number;                         // ID único
    descricao: string;                   // Descrição da conta
    valor: number;                       // Valor em reais
    dataVencimento: string;              // Data de vencimento
    status: 'PENDENTE' | 'PAGO' | 'ATRASADO'; // Status do pagamento
    motorista?: motorista;               // Motorista associado (opcional)
}
```

---

## 6. Serviços HTTP

### 6.1 AlunoService
**URL Base**: `http://localhost:8080/aluno`

```typescript
listarAlunos(): Observable<any[]>
  GET /aluno/listar
  Retorna: Array de alunos

CadastroAlunos(aluno: any): Observable<any>
  POST /aluno/salvar-aluno
  Body: Dados do aluno
  Retorna: Aluno criado

EditarAlunos(aluno: any): Observable<any>
  PUT /aluno/atualizar-aluno/{id}
  Body: Dados do aluno atualizado
  Retorna: Aluno atualizado

ExcluirAlunos(id: string | number): Observable<void>
  DELETE /aluno/deletar-aluno/{id}
  Retorna: void
```

### 6.2 FaculdadeService
**URL Base**: `http://localhost:8080/faculdade`

Estrutura similar ao AlunoService:
- `listarFaculdades()`
- `CadastroFaculdades(faculdade: any)`
- `EditarFaculdades(faculdade: any)`
- `ExcluirFaculdades(id: string | number)`

### 6.3 OnibusService
**URL Base**: `http://localhost:8080/onibus`

Estrutura similar ao AlunoService:
- `listarOnibus()`
- `CadastroOnibus(onibus: any)`
- `EditarOnibus(onibus: any)`
- `ExcluirOnibus(id: string | number)`

### 6.4 MotoristaService
**URL Base**: `http://localhost:8080/motorista`

Estrutura similar ao AlunoService:
- `listarMotoristas()`
- `CadastroMotoristas(motorista: any)`
- `EditarMotoristas(motorista: any)`
- `ExcluirMotoristas(id: string | number)`

### 6.5 ContaPagarService
**URL Base**: `http://localhost:8080/conta-pagar`

- `listarContas()`
- `CadastroContas(conta: ContaPagar)`
- `EditarContas(conta: ContaPagar)`
- `ExcluirContas(id: string | number)`

### 6.6 PagamentoService
Serviço responsável por processar pagamentos:
- `processarPagamento(contaId: number, valor: number)`
- `obterRecibo(pagamentoId: number)`

---

## 7. Sistema de Roteamento

**Arquivo**: [src/app/app.routes.ts](src/app/app.routes.ts)

```typescript
export const routes: Routes = [
  // Rota padrão - redireciona para alunos
  { path: '', redirectTo: 'alunos', pathMatch: 'full' },
  
  // Rotas principais
  { path: 'alunos', component: AlunoListar },
  { path: 'faculdades', component: FaculdadeListar },
  { path: 'onibuss', component: OnibusListar },
  { path: 'motoristas', component: MotoristaListar },
  { path: 'contapagar', component: ContaPagarComponent },
];
```

### Navegação Disponível:
- `/` → Redireciona para `/alunos`
- `/alunos` → Tela de listagem e cadastro de alunos
- `/faculdades` → Tela de listagem e cadastro de faculdades
- `/onibuss` → Tela de listagem e cadastro de ônibus
- `/motoristas` → Tela de listagem e cadastro de motoristas
- `/contapagar` → Tela de gestão de contas a pagar

---

## 8. Configurações

### 8.1 Configuração de Preferências (Prettier)
```json
{
  "printWidth": 100,
  "singleQuote": true,
  "overrides": [
    {
      "files": "*.html",
      "options": { "parser": "angular" }
    }
  ]
}
```

### 8.2 Backend URL
A aplicação se conecta a um backend na URL base: `http://localhost:8080`

**Serviços disponíveis no backend**:
- `/aluno` - Gerenciamento de alunos
- `/faculdade` - Gerenciamento de faculdades
- `/onibus` - Gerenciamento de ônibus
- `/motorista` - Gerenciamento de motoristas
- `/conta-pagar` - Gerenciamento de contas
- `/pagamento` - Processamento de pagamentos

---

## 9. Como Usar a Aplicação

### 9.1 Instalação
```bash
# Clonar o repositório
git clone <url-do-repositorio>

# Instalar dependências
npm install
```

### 9.2 Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm start
# ou
ng serve

# A aplicação estará disponível em: http://localhost:4200
```

### 9.3 Build para Produção
```bash
npm run build
# Os arquivos compilados serão gerados em: dist/integrador-frontend
```

### 9.4 Testes
```bash
# Executar testes unitários
npm test
# ou
ng test

# Teste com cobertura
ng test --code-coverage
```

### 9.5 Watch (desenvolvimento contínuo)
```bash
npm run watch
# Compila e monitora mudanças em tempo real
```

---

## 10. Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| **start** | `npm start` | Inicia servidor de desenvolvimento |
| **build** | `npm run build` | Compila para produção |
| **watch** | `npm run watch` | Observa mudanças e recompila |
| **test** | `npm test` | Executa testes unitários |
| **ng** | `npm run ng` | Executa comando Angular CLI |

---

## 11. Dependências Principais

### Runtime
- `@angular/common` - Utilidades comuns do Angular
- `@angular/compiler` - Compilador Angular
- `@angular/core` - Core do framework
- `@angular/forms` - Módulo de formulários
- `@angular/platform-browser` - Plataforma para navegador
- `@angular/router` - Sistema de roteamento
- `primeng` - Componentes UI de alta qualidade
- `rxjs` - Biblioteca de programação reativa
- `zone.js` - Zona de contexto para Angular

### Development
- `@angular/cli` - Ferramenta de linha de comando
- `@angular/build` - Ferramenta de build
- `@tailwindcss/postcss` - Integração Tailwind CSS
- `karma` - Test runner
- `jasmine-core` - Framework de testes

---

## 12. Features e Funcionalidades

### Gerenciamento de Alunos ✅
- [x] Listar todos os alunos com paginação
- [x] Criar novo aluno
- [x] Editar dados do aluno
- [x] Deletar aluno
- [x] Associar aluno a uma faculdade
- [x] Validação de CPF
- [x] Status de matrícula
- [x] Histórico de cadastro

### Gerenciamento de Faculdades ✅
- [x] Listar faculdades
- [x] Adicionar nova faculdade
- [x] Editar faculdade
- [x] Deletar faculdade
- [x] Endereço e localização

### Gerenciamento de Ônibus ✅
- [x] Listar ônibus disponíveis
- [x] Cadastrar novo ônibus
- [x] Editar dados do ônibus
- [x] Deletar ônibus
- [x] Upload de foto
- [x] Controlar capacidade
- [x] Status do veículo
- [x] Número de identificação

### Gerenciamento de Motoristas ✅
- [x] Listar motoristas
- [x] Cadastrar novo motorista
- [x] Editar motorista
- [x] Deletar motorista
- [x] Associar ônibus ao motorista
- [x] Validação de CNH
- [x] Controle de salário
- [x] Número de identificação

### Contas a Pagar ✅
- [x] Listar contas pendentes/pagas/atrasadas
- [x] Criar nova conta
- [x] Editar conta
- [x] Deletar conta
- [x] Processar pagamento
- [x] Gerar recibo
- [x] Filtrar por status
- [x] Associar a motorista

### Interface & UX ✅
- [x] Sidebar responsiva
- [x] Temas de cores (PrimeNG)
- [x] Ícones (PrimeIcons)
- [x] Diálogos de confirmação
- [x] Notificações (Toast)
- [x] Tabelas com sort e filtro
- [x] Formulários validados
- [x] Responsivo para mobile

---

## 13. Arquitetura e Padrões

### Padrão de Componentes
A aplicação segue uma arquitetura baseada em componentes Angular:

```
Componente Raiz (App)
    └── Sidebar (Navegação)
    └── Router Outlet
        └── Componentes de Página
            ├── Componente Listar
            └── Componente Cadastro
```

### Padrão de Serviços
Todos os serviços implementam o padrão de injeção de dependência:

```typescript
@Injectable({ providedIn: 'root' })
export class NomeService {
    constructor(private httpClient: HttpClient) {}
    
    metodo(): Observable<any> {
        return this.httpClient.get<any>(url);
    }
}
```

### Padrão Standalone Components
A aplicação utiliza componentes standalone do Angular 14+:

```typescript
@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, ...],
    // ...
})
export class MeuComponente {}
```

---

## 14. Estrutura de Pastas por Módulo

Cada módulo (aluno, faculdade, etc.) segue a estrutura:

```
modulo/
├── modulo-service.ts              # Serviço HTTP
├── modulo-service.spec.ts         # Testes do serviço
├── modelo/
│   └── modulo.ts                  # Interface/Classe do modelo
├── modulo-listar/                 # Componente de listagem
│   ├── modulo-listar.ts
│   ├── modulo-listar.html
│   ├── modulo-listar.css
│   └── modulo-listar.spec.ts
├── modulo-cadastro/               # Componente de cadastro/edição
│   ├── modulo-cadastro.ts
│   ├── modulo-cadastro.html
│   ├── modulo-cadastro.css
│   └── modulo-cadastro.spec.ts
└── modulo.spec.ts                 # Testes gerais do módulo
```

---

## 15. Fluxo de Dados

### Fluxo Típico de CRUD

```
Usuário Interage com Componente Listar
                ↓
Componente chama Serviço
                ↓
Serviço faz requisição HTTP
                ↓
Backend processa e retorna dados
                ↓
RxJS Observable emite dados
                ↓
Componente recebe e renderiza
                ↓
UI atualizada
```

### Exemplo: Criar Aluno

```
1. Usuário preenche formulário em aluno-cadastro
2. Clica em "Salvar"
3. aluno-cadastro.ts chama AlunoService.CadastroAlunos()
4. Serviço envia POST para http://localhost:8080/aluno/salvar-aluno
5. Backend cria aluno no banco
6. Resposta retorna ao frontend
7. Notificação de sucesso exibida
8. Formulário limpo ou componente listar atualizado
```

---

## 16. Configuração do TypeScript

### tsconfig.json (Base)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### tsconfig.app.json
Configuração específica para a aplicação (extends tsconfig.json)

### tsconfig.spec.json
Configuração específica para testes (extends tsconfig.json)

---

## 17. Sistema de Build

### Desenvolvimento
```bash
ng serve --open
# Compila em tempo real
# HMR (Hot Module Replacement) ativado
# Servidor em http://localhost:4200
```

### Produção
```bash
ng build --configuration production
# Minificação
# Tree-shaking
# Otimização de bundle
# Saída em dist/
```

---

## 18. Testes

### Execução de Testes
```bash
ng test
# Abre Karma e Chrome
# Reexecuta ao salvar arquivos
# Exibe relatório de cobertura
```

### Estrutura dos Testes
Cada componente/serviço tem um arquivo `.spec.ts` correspondente:

```typescript
describe('NomeService', () => {
  let service: NomeService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NomeService);
  });
  
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  it('should return alunos list', (done) => {
    service.listarAlunos().subscribe((alunos) => {
      expect(alunos.length).toBeGreaterThan(0);
      done();
    });
  });
});
```

---

## 19. Integração com Backend

### Requisitos do Backend
O backend deve disponibilizar as seguintes APIs RESTful:

#### Alunos
- `GET /aluno/listar` - Lista todos os alunos
- `POST /aluno/salvar-aluno` - Cria novo aluno
- `PUT /aluno/atualizar-aluno/{id}` - Atualiza aluno
- `DELETE /aluno/deletar-aluno/{id}` - Deleta aluno

#### Faculdades
- `GET /faculdade/listar`
- `POST /faculdade/salvar-faculdade`
- `PUT /faculdade/atualizar-faculdade/{id}`
- `DELETE /faculdade/deletar-faculdade/{id}`

#### Ônibus
- `GET /onibus/listar`
- `POST /onibus/salvar-onibus`
- `PUT /onibus/atualizar-onibus/{id}`
- `DELETE /onibus/deletar-onibus/{id}`

#### Motoristas
- `GET /motorista/listar`
- `POST /motorista/salvar-motorista`
- `PUT /motorista/atualizar-motorista/{id}`
- `DELETE /motorista/deletar-motorista/{id}`

#### Contas a Pagar
- `GET /conta-pagar/listar`
- `POST /conta-pagar/salvar-conta`
- `PUT /conta-pagar/atualizar-conta/{id}`
- `DELETE /conta-pagar/deletar-conta/{id}`

#### Pagamentos
- `POST /pagamento/processar` - Processa pagamento
- `GET /pagamento/recibo/{id}` - Gera recibo

---

## 20. Deployment

### Requisitos
- Node.js 18+ 
- npm 9+
- Angular CLI 21+

### Passos para Deploy
1. Build da aplicação:
   ```bash
   npm run build
   ```

2. Os arquivos compilados estarão em `dist/integrador-frontend`

3. Servir os arquivos em um servidor web (Apache, Nginx, etc.)

4. Garantir que:
   - Backend está rodando em `http://localhost:8080`
   - Arquivo `index.html` é servido para todas as rotas (SPA)

### Exemplo de Configuração Nginx
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    root /var/www/html/dist/integrador-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 21. Melhorias Futuras Sugeridas

- 🔄 Implementar cache com HttpInterceptors
- 🔐 Adicionar autenticação e autorização
- 📊 Adicionar gráficos e relatórios
- 📱 Melhorar responsividade mobile
- 🔔 Implementar WebSocket para notificações em tempo real
- 📄 Adicionar export para PDF/Excel
- 🌍 Implementar i18n (múltiplos idiomas)
- 🎨 Criar tema escuro
- ⚡ Implementar lazy loading de módulos
- 🧪 Aumentar cobertura de testes

---

## 22. Contato e Suporte

Para dúvidas ou sugestões sobre a aplicação:
- 📧 Email: suporte@exemplo.com
- 🐛 Issues: GitHub Issues
- 📚 Documentação: Ver README.md

---

## 23. Changelog

### Versão 0.0.0 (Inicial)
- ✅ Setup do projeto Angular 21
- ✅ Componentes CRUD básicos
- ✅ Integração com PrimeNG
- ✅ Sistema de roteamento
- ✅ Serviços HTTP
- ✅ Configuração Tailwind CSS
- ✅ Testes unitários

---

**Última atualização**: Maio 2026
**Versão**: 0.0.0
**Status**: Em desenvolvimento

---

> Esta documentação cobre todos os aspectos da aplicação Integrador Frontend. Para atualizações ou correções, favor enviar um pull request ou abrir uma issue.
