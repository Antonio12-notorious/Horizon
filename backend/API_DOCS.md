# MiniERP API - Backend Documentation

## 📋 Índice

- [Instalação](#instalação)
- [Configuração](#configuração)
- [Execução](#execução)
- [Endpoints](#endpoints)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Segurança](#segurança)

---

## 🚀 Instalação

### Pré-requisitos
- Node.js v18+
- npm ou yarn
- PostgreSQL 12+

### Steps

```bash
# Clonar repositório
git clone <repo-url>
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar migrations Prisma
npx prisma migrate dev

# (Opcional) Gerar tipos Prisma
npx prisma generate
```

---

## ⚙️ Configuração

### Variáveis de Ambiente Obrigatórias

Crie um arquivo `.env` na raiz do projeto com:

```env
# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/erp_crystech

# JWT (Mínimo 32 caracteres em produção)
JWT_SECRET=seu-super-secret-key-min-32-chars-production
JWT_EXPIRES_IN=1d

# EMAIL (Gmail SMTP)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app-google

# SERVER
PORT=3001
NODE_ENV=development

# FRONTEND
FRONTEND_URL=http://localhost:5173
```

### Configuração do Email

1. Ativar "Less secure app access" ou usar "App Password" no Gmail
2. Gerar App Password em: https://myaccount.google.com/apppasswords
3. Usar o password gerado em `EMAIL_PASS`

---

## ▶️ Execução

### Desenvolvimento (Hot-reload)

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
npm start
```

---

## 📡 Endpoints

### Authentication

#### POST `/api/auth/register`
Registrar novo usuário

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123456"
}
```

**Response (201):**
```json
{
  "message": "Usuário registrado com sucesso. Verifique seu email.",
  "user": {
    "id": "uuid",
    "email": "joao@example.com",
    "role": "Utilizador",
    "verified": false
  }
}
```

---

#### POST `/api/auth/login`
Fazer login

**Body:**
```json
{
  "email": "joao@example.com",
  "password": "senha123456"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "joao@example.com",
    "role": "Utilizador"
  }
}
```

---

#### GET `/api/auth/verify?token=<token>`
Verificar email

**Response (200):**
```json
{
  "message": "Email verificado com sucesso",
  "verified": true
}
```

---

### Clients

#### GET `/api/clients` ✅ Autenticado
Listar todos os clientes

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Cliente X",
    "email": "cliente@example.com",
    "phone": "+351912345678",
    "service": "Consultoria",
    "status": "Ativo",
    "createdAt": "2026-05-08T10:30:00Z"
  }
]
```

---

#### GET `/api/clients/:id` ✅ Autenticado
Obter cliente por ID

---

#### POST `/api/clients` ✅ Autenticado
Criar novo cliente

**Body:**
```json
{
  "name": "Novo Cliente",
  "email": "novo@example.com",
  "phone": "+351912345678",
  "service": "Consultoria",
  "status": "Ativo"
}
```

---

#### PUT `/api/clients/:id` ✅ Autenticado (Admin)
Atualizar cliente

**Body:** (todos os campos opcionais)
```json
{
  "name": "Cliente Atualizado",
  "email": "novo-email@example.com",
  "phone": "+351987654321",
  "status": "Inativo"
}
```

---

#### DELETE `/api/clients/:id` ✅ Autenticado (Admin)
Deletar cliente

**Response (200):**
```json
{
  "message": "Cliente deletado com sucesso"
}
```

---

### Services

#### GET `/api/services` ✅ Autenticado
Listar serviços

---

#### POST `/api/services` ✅ Autenticado (Admin)
Criar serviço

**Body:**
```json
{
  "name": "Consultoria Estratégica",
  "description": "Consultoria para empresas",
  "price": 500.00,
  "status": "Ativo"
}
```

---

### Invoices

#### GET `/api/invoices` ✅ Autenticado
Listar faturas com informações do cliente e serviço

---

#### GET `/api/invoices/:id` ✅ Autenticado
Obter fatura por ID

---

#### POST `/api/invoices` ✅ Autenticado (Admin)
Criar fatura

**Body:**
```json
{
  "clientId": "uuid",
  "serviceId": "uuid",
  "amount": 1500.00,
  "status": "Pendente"
}
```

---

#### PUT `/api/invoices/:id` ✅ Autenticado (Admin)
Atualizar fatura

---

#### DELETE `/api/invoices/:id` ✅ Autenticado (Admin)
Deletar fatura

---

### Appointments

#### GET `/api/appointments` ✅ Autenticado
Listar marcações

---

#### POST `/api/appointments` ✅ Autenticado
Criar marcação

**Body:**
```json
{
  "clientName": "João Silva",
  "service": "Consultoria",
  "date": "2026-05-15",
  "time": "14:30",
  "status": "Pendente"
}
```

---

#### PATCH `/api/appointments/:id` ✅ Autenticado (Admin)
Atualizar marcação

---

#### DELETE `/api/appointments/:id` ✅ Autenticado (Admin)
Deletar marcação

---

## 🏗️ Estrutura do Projeto

```
backend/
├── src/
│   ├── config/                 # Configuração centralizada
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Verificação JWT
│   │   ├── role.middleware.ts  # RBAC
│   │   ├── error.middleware.ts # Error handler global
│   │   └── validate.middleware.ts # Validação Zod
│   ├── modules/                # Recursos (Auth, Clients, etc)
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── services/
│   │   ├── invoices/
│   │   └── appointments/
│   ├── schemas/                # Validação (Zod)
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Funções auxiliares
│   ├── app.ts                  # Configuração Express
│   └── server.ts               # Entry point
├── prisma/
│   ├── schema.prisma           # Modelo de dados
│   └── migrations/             # Histórico BD
├── .env.example                # Template variáveis
└── package.json
```

---

## 🔒 Segurança

### Autenticação
- JWT com expiração de 1 dia
- Secret de mínimo 32 caracteres em produção
- Tokens verificados em todas as rotas protegidas

### Autorização
- RBAC com roles: `Admin`, `Utilizador`
- Middlewares garantem permissões por recurso
- Alterações protegidas por role `Admin`

### Validação
- Validação de input com Zod
- Sanitização automática
- Erros estruturados com mensagens claras

### Tratamento de Erros
- Error handler middleware centralizado
- Logs estruturados
- HTTP status codes apropriados

---

## 📝 Modelos de Dados

### User
- id (CUID)
- name
- email (único)
- password (hash bcrypt)
- role (`Admin`, `Utilizador`)
- verified (boolean)
- status (`Ativo`, `Inativo`)
- createdAt

### Client
- id (CUID)
- name
- email
- phone (opcional)
- service (opcional)
- status (`Ativo`, `Inativo`)
- createdAt

### Service
- id (CUID)
- name
- description (opcional)
- price
- status (`Ativo`, `Inativo`)
- createdAt

### Invoice
- id (CUID)
- clientId (FK)
- serviceId (FK)
- amount
- status (`Pendente`, `Pago`, `Cancelado`)
- createdAt

### Appointment
- id (CUID)
- clientName
- service
- date
- time
- status (`Pendente`, `Confirmado`, `Cancelado`)
- createdAt

---

## 🚧 Próximas Melhorias

- [ ] Refresh tokens
- [ ] Rate limiting
- [ ] API Documentation (Swagger)
- [ ] Testes unitários (Jest)
- [ ] Logging estruturado
- [ ] Caching (Redis)
- [ ] Audit logs
- [ ] 2FA (Two-Factor Authentication)

---

## 📞 Suporte

Para problemas ou dúvidas, verifique:
1. `.env` está configurado corretamente
2. PostgreSQL está rodando
3. Migrations foram executadas: `npx prisma migrate dev`
4. Porta 3001 está disponível
