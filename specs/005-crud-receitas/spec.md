# Feature Specification: Gerenciamento de Receitas/Entradas

**Feature Branch**: `005-crud-receitas`

**Created**: 2026-10-13

**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Cadastrar Receita (Priority: P1)

Um membro da conta família deseja registrar uma nova receita — seja um salário ou outra entrada financeira — para manter o controle financeiro familiar atualizado.

**Why this priority**: O cadastro é o ponto de entrada de toda a funcionalidade; sem ele, edição e exclusão não têm razão de existir. É também o caso de uso mais frequente.

**Independent Test**: Pode ser testado abrindo a modal de cadastro pelo botão "+" do footer, preenchendo os campos obrigatórios e confirmando. O registro deve aparecer na lista de receitas imediatamente após o sucesso.

**Acceptance Scenarios**:

1. **Given** o usuário está em qualquer tela do app com o footer visível, **When** toca no botão "+" do footer, **Then** a modal de cadastro de receita abre com os campos em branco.
2. **Given** a modal está aberta, **When** o usuário informa valor R$ 5.000,00, tipo "Salário" e mês de recebimento "Outubro/2026" e confirma, **Then** a receita é salva e a modal fecha com a lista atualizada.
3. **Given** a modal está aberta, **When** o usuário informa valor R$ 300,00, tipo "Outro", descrição "Freelance" e confirma, **Then** a receita é salva sem competência associada.
4. **Given** a modal está aberta, **When** o usuário deixa o valor em branco e tenta confirmar, **Then** uma mensagem de erro é exibida e a modal permanece aberta com os dados preservados.
5. **Given** a modal está aberta com tipo "Salário" selecionado, **When** o usuário não informa a competência e tenta confirmar, **Then** uma mensagem de erro é exibida no campo de mês de recebimento.
6. **Given** a modal está aberta, **When** o usuário alterna o tipo de "Salário" para "Outro", **Then** o campo de mês de recebimento desaparece imediatamente.
7. **Given** a modal está aberta, **When** o usuário toca no botão de cancelar, **Then** a modal fecha sem salvar nenhum dado.

---

### User Story 2 - Editar Receita (Priority: P2)

Um membro da conta família deseja corrigir ou atualizar os dados de uma receita já cadastrada.

**Why this priority**: Erros de digitação e mudanças de valor são comuns. A edição garante que o histórico permaneça preciso sem forçar o usuário a excluir e recadastrar.

**Independent Test**: Pode ser testado abrindo a edição de uma receita existente, alterando o valor e confirmando. A receita deve refletir o novo valor imediatamente na lista.

**Acceptance Scenarios**:

1. **Given** uma receita está listada, **When** o usuário aciona a opção de edição, **Then** o formulário abre preenchido com todos os dados atuais da receita.
2. **Given** o formulário de edição está aberto com uma receita do tipo "Salário", **When** o usuário altera o tipo para "Outro" e confirma, **Then** a competência é removida do registro e não aparece mais na edição.
3. **Given** o formulário de edição está aberto com uma receita do tipo "Outro", **When** o usuário altera o tipo para "Salário" sem informar competência e tenta confirmar, **Then** o sistema exibe erro e impede o salvamento.
4. **Given** o formulário de edição está aberto, **When** o servidor retorna erro ao salvar, **Then** os dados preenchidos são preservados e uma mensagem de erro é exibida.
5. **Given** o formulário de edição está aberto com dados válidos, **When** o usuário confirma, **Then** as alterações são persistidas e a interface reflete a atualização imediatamente.
6. **Given** o formulário de edição está aberto, **When** o usuário cancela, **Then** nenhuma alteração é salva e a receita permanece com os dados originais.

---

### User Story 3 - Excluir Receita (Priority: P3)

Um membro da conta família deseja remover uma receita cadastrada incorretamente ou que não é mais relevante.

**Why this priority**: Menos frequente que cadastro e edição, mas necessário para manter a lista organizada e os dados financeiros precisos.

**Independent Test**: Pode ser testado acionando a exclusão de uma receita e confirmando. A receita deve desaparecer da lista imediatamente.

**Acceptance Scenarios**:

1. **Given** uma receita está listada, **When** o usuário aciona a opção de excluir, **Then** uma confirmação é exibida identificando claramente a ação como destrutiva e irreversível.
2. **Given** a confirmação de exclusão está visível, **When** o usuário cancela, **Then** a receita permanece na lista intacta.
3. **Given** a confirmação de exclusão está visível, **When** o usuário confirma, **Then** apenas a receita selecionada é removida e a lista é atualizada.
4. **Given** o usuário confirma a exclusão, **When** o servidor retorna erro, **Then** uma mensagem de erro é exibida e a receita permanece disponível na lista.

---

### Edge Cases

- O que acontece se o usuário tentar submeter o formulário duas vezes rapidamente antes de receber resposta?
- O que acontece se o valor informado incluir mais casas decimais do que o permitido?
- O que acontece se o usuário tentar editar ou excluir uma receita de uma conta família da qual não é membro?
- O que acontece ao alterar o mês de recebimento de um salário já cadastrado para um mês diferente?

## Requirements

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que membros da conta família cadastrem receitas informando valor, tipo, descrição opcional e competência condicional.
- **FR-002**: O sistema DEVE exibir o campo de mês de recebimento exclusivamente quando o tipo selecionado for "Salário".
- **FR-003**: O sistema DEVE ocultar e limpar a competência imediatamente quando o tipo for alterado de "Salário" para "Outro".
- **FR-004**: O sistema DEVE exigir competência como obrigatória ao confirmar uma receita do tipo "Salário".
- **FR-005**: O sistema DEVE rejeitar valores em branco, zero ou negativos com mensagem de erro clara.
- **FR-006**: O sistema DEVE preservar os dados preenchidos no formulário quando uma operação falhar, permitindo nova tentativa.
- **FR-007**: O sistema DEVE exibir uma confirmação explícita antes de executar a exclusão definitiva de uma receita.
- **FR-008**: O sistema DEVE impedir que múltiplas submissões simultâneas da mesma operação gerem registros duplicados ou inconsistências.
- **FR-009**: O sistema DEVE refletir na interface o resultado de cada operação imediatamente após o sucesso.
- **FR-010**: O sistema DEVE autorizar operações de edição e exclusão somente para membros da conta família à qual a receita pertence.
- **FR-011**: O sistema DEVE identificar o usuário autenticado e a conta família exclusivamente no servidor, sem aceitar esses dados do cliente.
- **FR-012**: O sistema DEVE validar todos os dados de entrada tanto na interface quanto no servidor antes de persistir.
- **FR-013**: O sistema DEVE garantir que o valor monetário seja armazenado e recuperado sem perda de precisão decorrente de arredondamento.
- **FR-014**: O sistema DEVE garantir que a competência identifique exclusivamente mês e ano, sem dependência de dia específico.
- **FR-015**: O sistema DEVE garantir que a competência informada pelo usuário seja armazenada exatamente como selecionada, sem alteração involuntária por diferença de fuso horário.

### Key Entities

- **Receita**: Entrada financeira pertencente a uma conta família. Possui valor monetário, tipo (Salário ou Outro), descrição opcional, competência mensal opcional (obrigatória para Salário), data de criação, campos de auditoria e referência ao usuário responsável pelo registro.
- **Tipo de Receita**: Classificação com dois valores possíveis — "SALARIO" e "OUTRO". Determina se a competência é obrigatória ou deve ser nula.
- **Competência**: Identificador de mês e ano de referência de um salário. Não depende de dia específico do mês.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Um membro da conta família consegue registrar uma receita em menos de 60 segundos a partir da tela principal.
- **SC-002**: O campo de mês de recebimento aparece e desaparece instantaneamente ao alternar o tipo, sem recarregamento de página.
- **SC-003**: 100% das tentativas de edição ou exclusão por usuário sem acesso à conta familiar são bloqueadas com mensagem de erro adequada.
- **SC-004**: Nenhuma operação resulta em registro duplicado quando o botão de confirmação é acionado múltiplas vezes em rápida sucessão.
- **SC-005**: A interface funciona corretamente em dispositivos com tela a partir de 320px de largura e em navegadores desktop.
- **SC-006**: Nenhum valor monetário registrado apresenta diferença por arredondamento ao ser recuperado e exibido.

## Assumptions

- A tela de receitas já existe ou será criada em spec separada; esta spec cobre exclusivamente as operações de cadastro, edição e exclusão.
- O botão "+" do footer já está implementado e disponível como ponto de entrada para a modal de cadastro.
- A autenticação e o vínculo do usuário à conta família já estão implementados no projeto.
- A competência é representada internamente como uma data com dia fixo (primeiro dia do mês) para garantir que o mês/ano não seja alterado por conversão de fuso horário.
- O padrão de confirmação de ações destrutivas já existe no projeto (adotado nas despesas e cartões) e será reutilizado sem criação de novo componente.
- O mecanismo de feedback de erro já existe no projeto e será reutilizado sem criação de novo componente.
- Receitas pertencem exclusivamente a uma conta família; não há compartilhamento entre contas distintas.
- A edição reutiliza o mesmo formulário do cadastro para evitar duplicação de regras e componentes.
- Qualquer membro da conta família pode cadastrar e editar receitas; apenas administradores podem excluir, seguindo o mesmo padrão das despesas e cartões.
