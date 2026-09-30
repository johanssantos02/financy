# Domínio

## Conceitos iniciais

### Lançamento

Registro financeiro pertencente a um usuário. Deve representar receita ou despesa e conter, no mínimo, descrição, valor, data, categoria e situação.

### Categoria

Classifica lançamentos e sustenta filtros e relatórios. Categorias são isoladas por usuário; categorias padrão podem ser avaliadas depois.

### Recorrência

Regra que representa um compromisso repetido. Uma despesa fixa é uma recorrência de despesa marcada como previsível, evitando dois mecanismos concorrentes para o mesmo problema.

### Despesa

Compromisso de pagamento pertencente a uma **conta família**; todos os membros a visualizam.
Contém nome, valor, vencimento, data de lançamento, indicador de recorrência, descrição e tags.

- Nome, valor e vencimento são obrigatórios; o lançamento assume a data atual.
- O nome é único dentro da conta família, sem diferenciar maiúsculas/minúsculas e ignorando espaços
  nas extremidades.
- Recorrência é mensal e **calculada**: a despesa é cadastrada uma vez e aparece em toda competência
  a partir do mês do primeiro vencimento, no mesmo dia (ou no último dia de meses mais curtos).
- Somente o pagamento é persistido, um por despesa e competência. A situação é derivada da data
  atual em America/Sao_Paulo: **Paga**; **Vencida** (vencimento anterior a hoje); **Vencimento
  próximo** (até 5 dias, inclusive); **Aberta**.
- Qualquer membro marca ou desmarca pagamentos, inclusive os registrados por outro membro; marcar
  uma competência já paga é conflito.
- Apenas administradores excluem despesas. A exclusão é lógica: libera o nome, preserva pagamentos e
  mantém recorrentes visíveis apenas nas competências anteriores à exclusão.

### Tag

Rótulo livre de uma conta família para marcar e filtrar despesas; nome único na conta, sem
diferenciar maiúsculas/minúsculas.

### Item da lista de desejos

Intenção de compra com nome, valor estimado, prioridade e situação. Não altera saldos até ser convertido explicitamente em lançamento.

### Relatório

Visão derivada dos lançamentos do usuário por período, tipo e categoria. Não é uma entidade persistida no escopo inicial.

## Regras gerais

- Todo dado financeiro pertence a um usuário ou a uma conta família e nunca pode ser acessado apenas por identificador público.
- Valores são positivos; o tipo do lançamento define se representam entrada ou saída.
- Exclusões e alterações de recorrência não devem modificar ocorrências passadas sem confirmação explícita.
- Converter um desejo em compra deve gerar um lançamento e manter rastreabilidade da origem.
- Situações e tipos devem ser uniões ou enums explícitos, sem strings livres espalhadas pelo código.

## Fora do escopo inicial

- integração bancária automática;
- controle contábil ou fiscal;
- múltiplas moedas com conversão;
- orçamento compartilhado;
- investimentos e cálculo de rentabilidade;
- aplicativo móvel nativo.

As regras detalhadas serão definidas antes de implementar cada módulo, evitando antecipar complexidade.
