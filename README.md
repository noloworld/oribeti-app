# Oribeti App

Sistema de gestão de vendas e clientes para revendedores.

## 🚀 Funcionalidades

- **Gestão de Clientes**: Cadastro, edição e remoção de clientes
- **Gestão de Vendas**: Registro de vendas com múltiplos produtos
- **Sistema de Pagamentos**: Controle de pagamentos parcelados
- **Dashboard**: Relatórios e gráficos de vendas
- **Gestão de Despesas**: Controle de gastos
- **Sistema de Logs**: Auditoria de todas as ações
- **Autenticação**: Sistema seguro de login/logout

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite com Prisma ORM
- **Autenticação**: JWT com cookies httpOnly
- **UI**: Tailwind CSS, Headless UI
- **Gráficos**: Chart.js
- **Notificações**: React Hot Toast

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd oribeti-app
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` e configure:
```env
JWT_SECRET=sua-chave-secreta-muito-segura-aqui
NODE_ENV=development
```

4. **Configure o banco de dados**
```bash
npx prisma generate
npx prisma db push
```

5. **Execute o seed (opcional)**
```bash
npx prisma db seed
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🔐 Primeiro Acesso

1. Acesse `http://localhost:3000/login`
2. Use as credenciais padrão:
   - **Email**: admin@oribeti.com
   - **Senha**: admin123

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── auth/           # Autenticação
│   │   ├── clientes/       # Gestão de clientes
│   │   ├── vendas/         # Gestão de vendas
│   │   ├── pagamentos/     # Sistema de pagamentos
│   │   ├── despesas/       # Gestão de despesas
│   │   └── dashboard/      # Relatórios
│   ├── dashboard/          # Páginas do dashboard
│   └── login/              # Página de login
├── components/             # Componentes reutilizáveis
├── lib/                    # Utilitários e configurações
└── middleware.ts           # Middleware de autenticação
```

## 🔧 Configurações Importantes

### Segurança
- JWT_SECRET é obrigatório e deve ser uma string segura
- Cookies são configurados como httpOnly e secure em produção
- Middleware protege todas as rotas do dashboard

### Database
- SQLite para desenvolvimento
- Prisma ORM para queries
- Instância única do PrismaClient para performance

### Performance
- Instância única do PrismaClient
- Paginação em todas as listagens
- Lazy loading de dados

## 🐛 Correções Implementadas

### Problemas Corrigidos:
1. **Inconsistência no Schema**: Corrigido para usar SQLite em vez de PostgreSQL
2. **Segurança**: Removido JWT_SECRET hardcoded, agora usa variável de ambiente
3. **Performance**: Implementada instância única do PrismaClient
4. **Tipagem**: Melhorada tipagem TypeScript em todo o projeto
5. **Validação**: Corrigidas validações de dados nas APIs
6. **Estrutura de Dados**: Corrigidas referências a campos inexistentes
7. **Autenticação**: Unificada abordagem JWT entre middleware e APIs

### Melhorias:
- Melhor tratamento de erros
- Logs mais detalhados
- Interface mais responsiva
- Código mais limpo e organizado

## 📊 Funcionalidades do Sistema

### Gestão de Vendas
- Registro de vendas com múltiplos produtos
- Cálculo automático de valores
- Controle de status (PAGO/PENDENTE)
- Histórico de pagamentos

### Sistema de Pagamentos
- Pagamentos parcelados
- Cálculo automático de dívidas
- Histórico detalhado
- Atualização automática de status

### Dashboard
- Gráficos de vendas (mensal/anual)
- Top 5 clientes
- Clientes devedores
- Estatísticas gerais

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outros
- Configure o banco de dados de produção
- Ajuste as variáveis de ambiente
- Execute `npm run build`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 🆘 Suporte

Para suporte, entre em contato através dos issues do GitHub.
