# Financy

Aplicação web pessoal para organizar finanças, acompanhar compromissos e apoiar decisões com relatórios simples.

## Escopo inicial

- lançamentos de receitas e despesas;
- despesas fixas e recorrentes;
- lista de desejos;
- relatórios por período e categoria;
- autenticação e isolamento dos dados por usuário.

## Diretrizes

- Next.js com App Router, Server Components e SSR por padrão;
- arquitetura modular baseada em Feature-Sliced Design;
- backend mínimo: Auth.js para autenticação e operações CRUD;
- Prisma ORM 7 com migrations versionadas e PostgreSQL no Supabase;
- Zod nas fronteiras da aplicação;
- TypeScript em modo `strict`;
- código funcional, sem classes desnecessárias;
- ESLint e Prettier como padrão de qualidade;
- português em nomes próprios do domínio, arquivos e documentação; APIs nativas e convenções obrigatórias das bibliotecas permanecem no idioma original;
- começar simples, mantendo limites claros para permitir evolução sem grandes refatorações.

## Organização planejada

```text
app/                 # roteamento e composição do Next.js
src/
  pages/             # composição de páginas, sem relação com o Pages Router
  widgets/           # blocos grandes de interface
  features/          # ações e casos de uso
  entities/          # entidades e regras de domínio
  shared/            # infraestrutura e componentes reutilizáveis
prisma/              # schema e migrations
agents/              # decisões e orientações do projeto
```

A dependência entre camadas segue esta direção:

```text
app → pages → widgets → features → entities → shared
```

Uma camada só pode depender das camadas à sua direita. Exceções devem ser justificadas e documentadas.

## Estratégia de implementação

1. Base do projeto: qualidade, variáveis de ambiente, Prisma e autenticação.
2. Cadastros essenciais: categorias e lançamentos.
3. Despesas fixas e recorrentes.
4. Lista de desejos.
5. Relatórios e filtros.
6. Melhorias de experiência, testes e observabilidade.

## Desenvolvimento

```bash
npm run dev
npm run lint
npm run build
npm run prisma:validar
npm run db:migrar
```

Copie `.env.example` para `.env` e substitua os dados pelas conexões exibidas em **Connect** no projeto do Supabase. `DATABASE_URL` usa o pool transacional; `DIRECT_URL` usa a conexão direta.

## Decisões pendentes

- provedor inicial do Auth.js;
- regras de geração e alteração de recorrências;
- moeda, fuso horário e critérios dos relatórios;
- estratégia e ferramentas de testes.

## Documentação

- [Agente de contexto](agents/AGENTE_CONTEXTO.md)
- [Arquitetura](agents/ARQUITETURA.md)
- [Domínio](agents/DOMINIO.md)
- [Convenções](agents/CONVENCOES.md)

Esses documentos registram apenas decisões vigentes. Mudanças estruturais devem atualizá-los no mesmo trabalho que altera o código.
