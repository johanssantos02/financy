# Arquitetura

## Princípios

- Server Components são o padrão; usar `"use client"` somente quando houver estado, efeito ou API exclusiva do navegador.
- Buscar dados no servidor e o mais próximo possível de quem os consome.
- Usar Server Actions para mutações da interface.
- Criar Route Handlers apenas para autenticação, webhooks, integrações ou endpoints realmente necessários.
- Toda consulta e mutação deve considerar o usuário autenticado no servidor.
- Regra de domínio não deve depender de React, Next.js, Auth.js ou Prisma.

## Feature-Sliced Design

| Camada | Responsabilidade |
| --- | --- |
| `app` | rotas, layouts, providers, metadata e composição global |
| `pages` | composição de cada tela |
| `widgets` | blocos independentes e grandes da interface |
| `features` | ações do usuário e casos de uso |
| `entities` | modelos, regras e visualizações de entidades |
| `shared` | banco, autenticação, validação, utilitários e UI genérica |

Cada módulo pode conter segmentos como `ui`, `model`, `api` e `lib`. Expor somente a API pública por `index.ts` e evitar importações internas entre módulos.

## Fluxo de uma mutação

1. verificar a sessão no servidor;
2. validar a entrada com Zod;
3. executar o caso de uso;
4. acessar o Prisma por uma função de dados;
5. devolver resultado tipado e previsível;
6. revalidar a rota ou o cache afetado.

## Dados

- PostgreSQL no Supabase é o banco de dados oficial do projeto.
- A aplicação usa a conexão agrupada em `DATABASE_URL`; Prisma CLI e migrations usam a conexão direta em `DIRECT_URL`.
- O schema do Prisma representa persistência, não substitui os limites dos módulos.
- Valores monetários nunca usam ponto flutuante; usar `Decimal` no banco e conversão explícita nas fronteiras.
- Datas são persistidas de forma consistente e formatadas apenas na apresentação.
- Migrations são criadas, revisadas e versionadas; alterações manuais no banco não são fonte de verdade.
- Relatórios começam como consultas derivadas, sem duplicar dados antes de existir necessidade comprovada.

## Evolução

Adicionar abstrações apenas quando houver uso real. Filas, eventos, cache distribuído, repositórios genéricos e serviços separados ficam fora do início do projeto.
