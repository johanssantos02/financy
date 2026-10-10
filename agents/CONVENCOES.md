# Convenções

## Linguagem e nomes

- Documentação, textos da interface e nomes próprios do projeto ficam em português.
- Variáveis, funções, tipos, módulos e arquivos do domínio usam português claro.
- APIs nativas, palavras reservadas e nomes exigidos por bibliotecas não são traduzidos.
- Nomes descrevem intenção: `criarLancamento` é preferível a `processarDados`.

## Código

- TypeScript `strict`, sem `any` implícito ou coerções inseguras.
- Funções pequenas e puras sempre que possível.
- Composição de funções e módulos em vez de herança.
- Classes somente quando uma API externa exigir ou houver justificativa concreta.
- Retornos antecipados para reduzir aninhamento.
- Comentários explicam decisões, não repetem o código.
- Evitar utilitários genéricos antes de existir repetição real.

## Validação e erros

- Validar com Zod toda entrada externa: formulário, parâmetro, variável de ambiente e integração.
- Inferir tipos a partir dos schemas quando isso evitar duplicação.
- Não expor detalhes internos, consultas ou segredos em mensagens ao usuário.
- Representar resultados esperados de mutações com tipos discriminados.
- Exceções ficam reservadas para falhas inesperadas ou APIs que já trabalham dessa forma.

## Formulários

- O formulário valida no cliente com o mesmo schema Zod usado pela Server Action; o servidor valida de novo.
- `lerFormData` (`src/shared/lib/formulario`) converte `FormData` em objeto nos dois lados, descartando campos vazios.
- O envio usa `onSubmit` + `useTransition` chamando a Server Action, e não `<form action>`, para preservar os valores digitados quando há erro.
- Erro de campo: toast com a mensagem, borda `border-perigo`, `aria-invalid` e `aria-describedby` apontando para a mensagem sob o campo, e foco no primeiro campo inválido na ordem do formulário. Editar o campo remove o erro dele.
- O botão de envio fica desabilitado enquanto envia e após o sucesso, evitando registros duplicados.
- Telas de criação abertas pelo menu de criação recebem `?origem=<caminho interno>`, validado com `obterCaminhoInterno`. Cancelar ou salvar volta com `router.back()` quando há origem e histórico; caso contrário, `router.replace` para a origem ou para a listagem.

## Estilização e responsividade

- O design segue a abordagem **mobile-first**: estilos base se aplicam ao menor viewport e breakpoints maiores sobrescrevem conforme necessário.
- Usar os prefixos de breakpoint do Tailwind em ordem crescente: sem prefixo (base/mobile) → `sm:` → `md:` → `lg:` → `xl:` → `2xl:`.
- Evitar media queries manuais; preferir as utilitárias responsivas do Tailwind (`flex-col md:flex-row`, `text-sm lg:text-base`, etc.).
- Layouts e espaçamentos são definidos primeiro para telas pequenas e expandidos para telas maiores, nunca ao contrário.

## Next.js e React

- Componentes são funções.
- Server Component é o padrão.
- Estado de servidor não deve ser duplicado em estado local sem necessidade.
- Acessibilidade faz parte do componente: HTML semântico, rótulos, foco e navegação por teclado.
- Componentes genéricos ficam em `shared`; componentes do domínio permanecem no respectivo módulo.

## Persistência e segurança

- Nunca confiar em `usuarioId` recebido do cliente; obtê-lo da sessão no servidor.
- Selecionar apenas os campos necessários nas consultas.
- Transações devem proteger operações que precisam ser atômicas.
- Segredos ficam em variáveis de ambiente e nunca são versionados.

## Testes

O projeto usa **Vitest** com **Testing Library** para testes unitários e de componente.

- Arquivos `*.test.ts` e `*.test.tsx` ficam ao lado do código que testam.
- Componentes de navegador (Client Components) declaram `// @vitest-environment jsdom` no topo do arquivo.
- Server Actions e módulos `server-only` são testados no ambiente padrão (`node`) com mocks de `@/src/shared/api/prisma`, `@/src/shared/lib/sessao` e `next/cache`.
- Server Components assíncronos são verificados manualmente, pois o Testing Library ainda não suporta RSC em testes de unidade.
- Prioridade: regras de domínio (schemas Zod), autorização (Server Actions) e fluxos CRUD críticos.

## Qualidade

Antes de concluir uma mudança, executar as verificações disponíveis e adequadas:

```bash
npm test
npm run lint
npm run build
```
