# pages (raiz)

Pasta intencionalmente vazia. O Next.js procura `pages/` na raiz antes de `src/pages`; sem ela,
a camada `src/pages` do Feature-Sliced Design seria tratada como Pages Router e o build falharia
com "`pages` and `app` directories should be under the same folder".

Não adicione rotas aqui: o roteamento do projeto usa exclusivamente o App Router em `app/`.
