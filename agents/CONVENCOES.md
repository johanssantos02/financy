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

## Qualidade

Antes de concluir uma mudança, executar as verificações disponíveis e adequadas:

```bash
npm run lint
npm run build
```

Testes devem priorizar regras de domínio, autorização e fluxos CRUD críticos quando a infraestrutura de testes for adicionada.
