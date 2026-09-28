<!--
SYNC IMPACT REPORT
==================
Mudança de versão:   1.0.0 → 1.0.1
Princípios modificados: todos (tradução integral para português)
Seções adicionadas:  nenhuma
Seções removidas:    nenhuma
TODOs pendentes:     nenhum
-->

# Constituição do Financy

## Princípios fundamentais

### I. Feature-Sliced Design (INEGOCIÁVEL)

A dependência entre camadas segue estritamente a direção `app → pages → widgets → features → entities → shared`.
Uma camada NÃO DEVE importar de nenhuma camada à sua esquerda. Cada módulo DEVE expor apenas sua
API pública via `index.ts`; importações internas entre módulos são proibidas. Exceções DEVEM ser
explicitamente justificadas e documentadas no arquivo `agents/` afetado.

**Justificativa**: o FSD impõe limites claros de responsabilidade e mantém os módulos evoluíveis
de forma independente, sem acoplamento oculto.

### II. React orientado ao servidor

Server Component é o padrão. `"use client"` DEVE ser adicionado somente quando o componente
precisar de estado local, efeitos colaterais ou uma API exclusiva do navegador. A busca de dados
acontece no servidor, o mais próximo possível de quem os consome. Mutações DEVEM usar Server Actions.
Route Handlers são criados apenas para callbacks de autenticação, webhooks ou integrações com
sistemas externos.

**Justificativa**: maximiza os ganhos de desempenho dos RSC e mantém a lógica de auth e dados
sob controle do servidor.

### III. Segurança de tipos e validação nas fronteiras

O modo `strict` do TypeScript é obrigatório em todo o código. `any` implícito ou injustificado
NÃO DEVE ser usado. Toda entrada externa — formulários, parâmetros de URL, variáveis de ambiente,
respostas de API — DEVE ser validada com Zod na fronteira em que entra no sistema. Os tipos DEVEM
ser inferidos a partir dos schemas Zod para evitar duplicação de definições.

**Justificativa**: elimina surpresas de tipo em tempo de execução e torna violações de contrato
visíveis em tempo de compilação.

### IV. Isolamento de dados e segurança

Todo registro financeiro pertence a um único usuário. O `usuarioId` DEVE ser obtido da sessão no
servidor; recebê-lo como entrada do cliente é proibido. Consultas DEVEM selecionar apenas os campos
necessários para o chamador. Valores monetários DEVEM usar `Decimal` no banco de dados — aritmética
de ponto flutuante para dados financeiros é proibida. Segredos DEVEM residir em variáveis de
ambiente e NÃO DEVEM ser versionados.

**Justificativa**: dados financeiros roteados para o usuário errado ou corrompidos por arredondamento
de ponto flutuante representam falha de corretude com dano direto ao usuário.

### V. Simplicidade e crescimento intencional

Comece com o design mais simples que atenda ao requisito. Abstrações são adicionadas apenas quando
houver repetição real — não em antecipação a ela. A lógica de domínio NÃO DEVE depender de React,
Next.js, Auth.js ou Prisma; DEVE ser testável de forma independente. Filas, cache distribuído,
repositórios genéricos, sistemas de eventos e serviços separados ficam adiados até que sejam
comprovadamente necessários pelo uso real.

**Justificativa**: abstrações prematuras geram custo de manutenção antes de gerar valor; manter a
lógica de domínio livre de frameworks protege o núcleo da troca de bibliotecas.

## Stack e restrições

Stack oficial: Next.js 16 App Router · React 19 · TypeScript strict · Tailwind CSS v4 (mobile-first)
· Prisma ORM 7 · PostgreSQL (Supabase) · Auth.js next-auth v5 · Zod v4 · ESLint.

- A aplicação usa a conexão agrupada (`DATABASE_URL`); o CLI do Prisma e as migrations usam a
  conexão direta (`DIRECT_URL`).
- Migrations são versionadas em `prisma/migrations/`; alterações manuais no banco não são fonte de
  verdade e DEVEM ser refletidas em uma migration antes do merge.
- A interface é mobile-first: estilos base do Tailwind visam viewports pequenos; prefixos de
  breakpoint sobrescrevem em ordem crescente (`sm:` → `md:` → `lg:` → `xl:` → `2xl:`).
- HTML acessível faz parte de todo componente: elementos semânticos, rótulos visíveis, gerenciamento
  de foco e navegação por teclado são obrigatórios — não opcionais.
- O código é funcional; classes são usadas apenas quando uma API externa exigir ou houver
  justificativa concreta.
- Português é usado em nomes de domínio, variáveis, funções, módulos e toda a documentação.
  Identificadores exigidos por bibliotecas e palavras reservadas da linguagem permanecem no idioma
  original.

## Fluxo de desenvolvimento

Antes de concluir qualquer mudança, as verificações abaixo DEVEM passar sem erros:

```bash
npm run lint
npm run build
```

Sequência obrigatória para mutações no servidor:

1. Verificar a sessão autenticada no servidor.
2. Validar toda entrada com Zod.
3. Executar o caso de uso.
4. Acessar o banco via função de dados dedicada no Prisma.
5. Devolver um resultado tipado e discriminado.
6. Revalidar a rota ou o segmento de cache afetado.

Mudanças estruturais — novos conceitos de domínio, decisões de arquitetura, convenções atualizadas —
DEVEM atualizar os documentos `agents/` afetados no mesmo conjunto de alterações que o código.

## Governança

Esta constituição substitui todas as práticas informais e orientações conflitantes. Alterações seguem
o processo definido em `agents/AGENTE_CONTEXTO.md`: investigar o contexto existente, propor uma
recomendação consolidada e obter validação do usuário antes de mudanças estruturais ou irreversíveis.

Política de versionamento de alterações:

- **MAJOR**: remoção ou redefinição incompatível de um princípio existente. Requer discussão
  explícita e plano de migração.
- **MINOR**: novo princípio adicionado ou princípio existente materialmente expandido. Atualizar a
  constituição e todos os documentos `agents/` afetados no mesmo PR.
- **PATCH**: esclarecimento, melhoria de redação ou correção de typo. Atualização de arquivo único
  é aceitável.

Todos os pull requests e revisões de código DEVEM verificar conformidade com os princípios acima.

**Versão**: 1.0.1 | **Ratificada**: 2026-09-28 | **Última alteração**: 2026-09-28
