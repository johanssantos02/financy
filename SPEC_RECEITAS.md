# Especificação: Gerenciamento de Receitas/Entradas

## Objetivo

Implementar a funcionalidade de gerenciamento de receitas/entradas no Financy, permitindo cadastrar, editar e excluir entradas financeiras, classificando-as por tipo e associando salários ao respectivo mês de recebimento.

A implementação deve contemplar a modelagem da entidade no Prisma, as migrations necessárias, a persistência dos dados e a interface mobile-first para navegador.

## Comportamento

### 1. Cadastro

- O cadastro deve ser realizado por meio de uma modal, seguindo a mesma ideia visual e de interação da opção de adicionar ("+") do footer existente.
- A modal deve apresentar os campos:
  - Valor: obrigatório.
  - Tipo: obrigatório, com as opções "Salário" e "Outro".
  - Descrição: opcional.
  - Mês de recebimento: exibido somente quando o tipo selecionado for "Salário".
- Ao confirmar, os dados devem ser validados e persistidos.
- Após o sucesso, a modal deve fechar e a interface deve refletir a operação, seguindo os padrões existentes no projeto.

### 2. Edição

- Deve ser possível editar uma entrada já cadastrada por meio de uma interface compatível com o padrão visual do projeto.
- O formulário de edição deve ser preenchido com os dados atuais da entrada.
- O usuário deve poder alterar o valor, o tipo, a descrição e, quando aplicável, o mês de recebimento.
- As mesmas regras de validação do cadastro devem ser aplicadas à edição.
- Ao alterar o tipo de "Salário" para "Outro", a competência salarial deve deixar de ser aplicada e não pode permanecer associada ao registro.
- Ao alterar o tipo de "Outro" para "Salário", o mês de recebimento deve se tornar obrigatório.
- A edição deve persistir as alterações no banco de dados e atualizar a interface após o sucesso.
- Em caso de erro, os dados preenchidos devem ser preservados para permitir nova tentativa.

### 3. Exclusão

- Deve ser possível excluir uma entrada já cadastrada.
- Antes da exclusão definitiva, a interface deve solicitar confirmação do usuário, identificando claramente a ação destrutiva.
- Após a confirmação, o registro deve ser removido do banco de dados.
- Após o sucesso, a interface deve refletir a exclusão.
- Se o usuário cancelar a confirmação, nenhum dado deve ser excluído.
- Em caso de falha, o sistema deve informar o erro e manter o registro disponível na interface.

## Regras

### 1. Modelagem e persistência

- Criar a entidade "Receita" no schema do Prisma, ou utilizar a nomenclatura equivalente caso já exista uma convenção consolidada no projeto.
- Criar e aplicar a migration correspondente, respeitando o fluxo de migrações existente.
- Cada receita deve pertencer a uma "ContaFamilia" e registrar o usuário responsável pela criação.
- A entidade deve conter, no mínimo:
  - Identificador.
  - Valor monetário.
  - Tipo.
  - Descrição opcional.
  - Competência mensal opcional.
  - Data de criação.
- A entidade deve possuir os campos de auditoria ou atualização exigidos pelos padrões existentes no projeto.
- O tipo deve aceitar exclusivamente "SALARIO" e "OUTRO", utilizando enum quando compatível com a modelagem existente.
- A competência deve representar mês e ano, sem depender de um dia específico do mês.
- Alterações e exclusões devem respeitar a integridade referencial e as convenções de persistência existentes.

### 2. Validação

- O valor é obrigatório, numérico e maior que zero.
- A precisão monetária deve seguir o padrão adotado pelo projeto, evitando imprecisões de ponto flutuante na persistência.
- O tipo é obrigatório e deve corresponder a uma das opções permitidas.
- A descrição é opcional e deve respeitar os limites de validação existentes.
- Para "SALARIO", a competência mensal é obrigatória.
- Para "OUTRO", a competência deve ser nula.
- As regras devem ser validadas no cliente e no servidor.
- A edição deve validar o resultado final dos dados, não apenas os campos alterados.

### 3. Competência salarial

- A competência deve identificar mês e ano.
- O armazenamento deve evitar alterações involuntárias de competência decorrentes de conversões de fuso horário.
- A competência deve ser exibida e selecionada de maneira clara na interface.
- A edição deve permitir alterar a competência de um salário já cadastrado.

### 4. Segurança e autorização

- O servidor deve identificar o usuário autenticado e validar seu acesso à conta familiar associada à receita.
- Não se deve confiar exclusivamente em identificadores enviados pelo cliente para autorizar operações.
- Cadastro, edição e exclusão devem respeitar as permissões existentes para membros da conta familiar.
- O usuário não pode editar ou excluir receitas de contas familiares às quais não tenha acesso.
- A exclusão deve atingir somente a receita identificada e autorizada, sem afetar outros registros.

### 5. Interface e experiência de uso

- A interface deve ser mobile-first e funcionar em navegadores móveis e desktop.
- O cadastro deve utilizar a modal associada ao botão "+" do footer como referência visual e comportamental.
- A edição deve reutilizar o formulário de cadastro sempre que possível, evitando duplicação de regras e componentes.
- O campo de competência deve aparecer dinamicamente conforme o tipo selecionado.
- Ao alternar de "SALARIO" para "OUTRO", a competência deve ser limpa e enviada como nula.
- As operações devem apresentar estados de carregamento e impedir submissões duplicadas.
- Os erros devem ser apresentados pelos mecanismos de feedback já adotados no projeto.
- O cancelamento de cadastro ou edição não deve persistir alterações.
- A confirmação de exclusão deve seguir o padrão visual já existente no projeto.

## Critérios de aceite

- [ ] É possível abrir a modal de cadastro pela ação definida na interface.
- [ ] O cadastro permite informar valor, tipo e descrição opcional.
- [ ] O campo de competência aparece e é obrigatório para salários.
- [ ] O campo de competência fica oculto e não é persistido para entradas do tipo "OUTRO".
- [ ] Não é possível cadastrar ou editar entradas com valor vazio, inválido, zero ou negativo.
- [ ] É possível cadastrar uma entrada sem descrição.
- [ ] Os registros são persistidos com seus dados, conta familiar, usuário responsável e datas aplicáveis.
- [ ] O schema do Prisma e a migration necessária estão implementados.
- [ ] É possível abrir a edição de uma receita existente com os campos preenchidos pelos dados atuais.
- [ ] É possível alterar o valor, o tipo, a descrição e a competência quando aplicável.
- [ ] Ao mudar de "SALARIO" para "OUTRO", a competência anterior deixa de ser aplicada.
- [ ] Ao mudar de "OUTRO" para "SALARIO", é obrigatório informar a competência.
- [ ] As alterações são persistidas e refletidas na interface após o sucesso.
- [ ] É solicitada confirmação antes da exclusão definitiva.
- [ ] Cancelar a confirmação mantém o registro intacto.
- [ ] Confirmar a exclusão remove somente a receita selecionada e autorizada.
- [ ] Falhas de cadastro, edição ou exclusão são comunicadas sem apresentar falsamente a operação como concluída.
- [ ] Os dados preenchidos são preservados quando uma operação falha, permitindo nova tentativa quando aplicável.
- [ ] Cadastro, edição e exclusão respeitam as permissões da conta familiar.
- [ ] As operações impedem submissões duplicadas durante o processamento.
- [ ] A interface funciona em dispositivos móveis e navegadores desktop.

## Fora de escopo

- Implementação de testes automatizados.
- Recorrência automática de receitas e geração mensal de salários.
- Dashboard, gráficos, relatórios e indicadores financeiros.
- Histórico detalhado de alterações das receitas.
- Integrações bancárias ou importação automática de transações.
- Anexos, comprovantes ou documentos associados às receitas.
- Notificações de recebimento.
- Alterações em funcionalidades não necessárias para o gerenciamento de receitas/entradas.
