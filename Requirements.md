1. 🧾 Visão Geral do Sistema
O sistema é uma aplicação web responsiva desenvolvida em Next.js, destinada a gerir as vendas de produtos Avon, O Boticário e Oriflame. A aplicação será utilizada inicialmente por dois administradores (mãe e filho), com possibilidade futura de adicionar novos administradores.

2. 👥 Usuários
2.1. Tipo de Usuários
Administrador

Tem acesso total ao sistema

Pode ver, editar e excluir dados

Pode adicionar outros administradores no futuro

2.2. Cadastro e Login
Apenas administradores podem acessar

Sem funcionalidade de registro

Página de login:

Campos: Email, Senha

Botão: "Acessar Painel"

Após o login, o usuário é redirecionado para "Resumo Geral"

3. 🧭 Navegação (Menu Lateral)
Resumo Geral

Registo Vendas

Vendas Natal

Clientes

Devedores

Despesas

4. 📊 Módulo: Resumo Geral
Painel com os seguintes componentes:

Total de clientes

Total de vendas

Total ganho (€)

Clientes devedores

Gráfico de vendas por mês

Top 5 clientes (ranking por valor)

Gastos por cliente (dropdown)

Últimos clientes adicionados

5. 🧾 Módulo: Registo de Vendas
Tabela listando:

Nome do cliente

Nome do produto

Valor da revista

Valor final

Data da venda

Funcionalidades:

Botão "Adicionar venda"

Botão "Editar" em cada linha

Paginação

Filtro por quantidade de registos por página

6. 🎄 Módulo: Vendas de Natal
Similar ao registo de vendas, mas exclusivamente para vendas de Natal.

Campos:

Nome do cliente

Nome do produto

Valor da venda

Data da venda

7. 👥 Módulo: Clientes
Tabela com:

Nome do cliente

Email

Telefone

Morada

Funcionalidades:

Procurar cliente (input de busca)

Botão "Adicionar cliente"

Botão "Editar" em cada linha

8. 💸 Módulo: Clientes Devedores
Lista com:

Nome do cliente

Valor em dívida

Data desde que deve

Funcionalidades:

Botão "Adicionar cliente devedor"

Botão "Editar"

9. 📉 Módulo: Despesas
Tabela com:

Nome da despesa

Valor da despesa

Data da despesa

Funcionalidades:

Botão "Adicionar nova despesa"

Botão "Editar"

10. 📱 Responsividade
O sistema deve funcionar perfeitamente em:

PCs (monitores grandes)

Telemóveis (telas pequenas)

Tablets

Layout responsivo com uso de Flexbox ou Grid, e media queries ou Tailwind CSS.

11. 🔒 Segurança
Apenas usuários autenticados conseguem acessar o sistema

Sem rotas públicas, exceto a página de login

Proteção contra acesso não autorizado com middleware de autenticação

12. 🔧 Tecnologias e Ferramentas Sugeridas
Next.js (framework React para SSR)

Tailwind CSS (estilização)

Firebase/Auth0/Supabase para autenticação

Prisma + PostgreSQL ou MongoDB para base de dados

Chart.js ou Recharts para gráficos

React Hook Form + Yup para validações

13. 🧪 Funcionalidades Futuras (não obrigatórias no MVP)
Exportar dados (PDF/Excel)

Notificações automáticas

Multiusuário (adicionar/remover administradores)

Backup automático dos dados

oribeti-app/
├── app/                    # (se usar app router)
│   ├── layout.tsx          # Layout base (menu lateral, etc.)
│   ├── page.tsx            # Redireciona para /dashboard
│   ├── login/              # Página de login
│   │   └── page.tsx
│   ├── dashboard/          # Área protegida
│   │   ├── layout.tsx      # Layout da dashboard (menu lateral + conteúdo)
│   │   ├── page.tsx        # Resumo Geral
│   │   ├── vendas/         # Registo de Vendas
│   │   │   ├── page.tsx
│   │   │   └── [id]/edit.tsx  # Página de edição da venda
│   │   ├── vendas-natal/
│   │   │   ├── page.tsx
│   │   │   └── [id]/edit.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/edit.tsx
│   │   ├── devedores/
│   │   │   ├── page.tsx
│   │   │   └── [id]/edit.tsx
│   │   ├── despesas/
│   │   │   ├── page.tsx
│   │   │   └── [id]/edit.tsx
│   │   └── settings/       # (opcional futuro)
├── components/             # Componentes reutilizáveis (Cards, Sidebar, Header...)
├── lib/                    # Funções auxiliares (auth, db, utils...)
├── styles/                 # Arquivos de estilo
├── middleware.ts           # Proteção de rotas com auth
├── tailwind.config.ts      # Tailwind config
├── tsconfig.json
└── package.json


📄 Descrição das Páginas


/login
Formulário com:

Email

Senha

Botão “Acessar Painel”

Sem opção de cadastro

Redireciona para /dashboard após login

/dashboard
Mostra:

Cards com totais (clientes, vendas, etc.)

Gráfico de vendas

Tabela de últimos clientes

Gastos por cliente

Top 5 clientes

/dashboard/vendas
Tabela com:

Nome do cliente

Produto

Valor da revista

Valor final

Data

Botões: Adicionar | Editar

Modal para adicionar venda

/dashboard/vendas-natal
Funciona igual à página de vendas, mas separado para vendas natalinas

/dashboard/clientes
Lista de clientes com dados de contacto

Campo de busca

Botões: Adicionar | Editar

/dashboard/devedores
Lista com clientes devedores

Campos: Nome, valor em dívida, desde quando

Botões: Adicionar | Editar

/dashboard/despesas
Lista com:

Nome da despesa

Valor

Data

Botões: Adicionar | Editar

🔐 Middleware de Proteção (middleware.ts)
ts
Copiar
Editar
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};