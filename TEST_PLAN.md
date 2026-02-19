
# Plano de Testes Unitários e Integração - 3R Grill

Este documento descreve a estratégia de testes para garantir 100% de confiabilidade e saúde do sistema, cobrindo lógica de negócio, integrações e interface.

## 🎯 Objetivos
- **Qualidade:** Detectar regressões instantaneamente.
- **Confiabilidade:** Garantir que o cálculo de pedidos e descontos esteja sempre correto.
- **Saúde do Banco:** Validar integrações com Appwrite/Cloud Functions.
- **Cobertura:** Manter > 90% de cobertura de código.

## 🛠️ Stack de Testes
- **Runner:** Vitest (Rápido e integrado ao Vite).
- **DOM Testing:** React Testing Library + JSDOM.
- **Mocking:** MSW (Mock Service Worker) para interceptar chamadas de rede.
- **E2E:** Playwright (Para fluxos completos de checkout).

---

## 🏗️ Estrutura de Testes

### 1. Testes de Unidade (Lógica)
Foco em funções puras e regras de negócio.
- **Local:** `src/services/__tests__`
- **Alvos:** 
    - `dataService.js`: Gerenciamento de SKUs, formatação de dados.
    - `utils/`: Helpers de datas e preços.

### 2. Testes de Integração (Contextos e Hooks)
Garantir que os estados globais funcionam entre si.
- **Local:** `src/context/__tests__`
- **Alvos:** 
    - `AuthContext`: Fluxo de login, logout e persistência de perfil.
    - `CartContext`: Adição/Remoção de itens, cálculo de total.
    - `OrderContext`: Histórico local de pedidos.

### 3. Testes de Componentes (UI)
Garantir que o usuário vê o que deve ver.
- **Local:** `src/components/__tests__` e `src/pages/__tests__`
- **Alvos:** 
    - `ProductCard`: Exibição de preços normais vs promocionais.
    - `CartSidebar`: Validação de campos obrigatórios (Nome/WhatsApp).
    - `Admin`: Filtros de tabela e toggles de ativo/inativo.

### 4. Testes de Integração Backend
Interação real ou mockada com Appwrite.
- **Database:** Validar esquemas e permissões.
- **Functions:** Validar payloads enviados para a função `place_order`.

---

## 📊 Painel de Gestão (Admin Dashboard)
Criaremos um painel dinâmico na aba **Configurações** que exibirá:
- ✅ **Status de Saúde:** (Pass/Fail) baseado na última execução de testes.
- 📈 **Cobertura de Código:** % de linhas testadas.
- 🔗 **Conectividade:** Status da conexão com os buckets e tabelas Appwrite.
- 🕒 **Última Verificação:** Timestamp da última análise de integridade.

## 🚀 Como Executar
- `npm test`: Roda todos os testes em modo watch.
- `npm run test:ui`: Abre o dashboard visual do Vitest.
- `npm run test:coverage`: Gera relatório de cobertura nos formatos HTML e JSON.
