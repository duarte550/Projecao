# Premissas e Lógica de Cálculo do Fluxo de Caixa

Este documento descreve as metodologias e a arquitetura matemática sob as quais opera a simulação financeira dos projetos imobiliários. 
A projeção do modelo percorre sistematicamente o cronograma de vida útil do projeto desde a data-base de análise até o esgotamento do estoque de empreendimentos via repasses do VGV. O processamento é estruturado mês a mês, executando uma estrita ordem de cálculo.

## 1. Premissas Base do Motor de Cálculo
O modelo consolida três grandes blocos de variáveis iniciais para cada projeto:
1. **Dados de Fotografia (Presente):** Saldo de Caixa na SPE, Percentual Vendido/Executado Atual, Custo Remanescente Estimado (*Incorrer*), Carteira de Recebíveis a vista (*Pré/Pós*).
2. **Stress Financeiro (Simulação):** Sobrecusto, Extensão do prazo (*Atraso*), Desconto nas prateleiras finais (*Revenda*) e Taxas transacionais na entrada comercial (RET, Corretagem).
3. **Curvas Macro (Dinâmicas):** Crescimento atrelado ao INCC mensal impactando custo contábil remanescente, enquanto prêmios de CDI, IPCA, TR tracionam o crescimento passivo das dívidas e rendimentos de caixa (em torno de 85% do CDI).

---

## 2. Ordem Sequencial do Varrimento (Waterfall Mensal)

Para cada mês subsequente na projeção (`M+1`, `M+2`, ...), as seguintes etapas são empilhadas de forma progressiva e irreversível, de forma que o fechamento do caixa retroalimente sempre as contingências de caixa e dívida do mês posterior. 

### Passo 1: Determinação Histórica (Tracking Macro/Fase)
- Classificar a realidade da janela de execução (`Fase de Construção`, `Fase de Carência Repasse (3m)`, `Fase de Repasse Intenso (6m)` ou `Remanescente e Liquidação de Estoque (15m)`).
- **Reajuste de Curvas Onerosas:** Todos os passivos não consumados de Construção (`custoAIncorrer`) e da Carteira de Valores a Receber (`poolPreChaves`, `poolRepasses`, e o montante em `VGV físico de Estoque`) são inflacionados pelo percentual efetivo do indexador estipulado ao mês recorrente (ex: Correção Monetária INCC).  

### Passo 2: Avanço Probabilístico da Obra (Método Beta)
- O sistema localiza o "período absoluto atual da curva da obra" interpolando a `Diferença(Mês Atual, Data Inicial da Obra)`.
- Calcula o trecho e o custo devido a este mês cruzando as frações globais resultantes da **Curva Beta Normalizada** (de 0 a 1) sobre o novo Custo Total Inflacionado no *Passo 1*.
- Gera-se um rombo negativo (`constructionCost`) que precisará ser quitado em caixa antes da rolagem.

### Passo 3: Liberação do Financiamento à Construção (Drawdown)
- Entendendo que os bancos injetam os fundos na lógica *Reembolso (M-1)*, projeta-se o valor aportado pelo Sindicato/Banco tendo como espelho histórico o rombo gerado no `Passo 2` do mês interior:
  - Opção a) **100% do Custo:** Desembolso integral referente ao caixa de obras.
  - Opção b) **Pelo % Financiado:** Desembolso apenas com base na LTV (*Loan-To-Cost*) limite estabelecida pela planilha.
- **Teto Absoluto Limite:** Qualquer nova liberação paralela está sumariamente vetada de ultrapassar o cinto do `Saldo Financiamento Previsto`.

### Passo 4: Dinâmica Comercial e Caixa Intermediário
- **Vender:** Puxar o total de vendas orgânicas daquele mês atreladas ao input do cenário e ao estoque não percorrido.
- **Arrecadar:** Deste valor de vendas líquido e da maturação da carteira passada de parcelas, deduz-se diretamente na "cabeça": retenção da comissão de corretagem (ex: 6%) e Carga tributária consolidada (RET = 4%).
- **Caixa Disponível Parcial:** O resquício saudável dessas deduções adentra o CAIXA ao lado do saldo de caixa final que rolou do mês pretérito.

### Passo 5: Cascata Hierárquica Estática (Waterfall Payments) 
Após possuir o poder de fogo gerado pela máquina comercial e pelo banco (Passo 4 + Passo 3), destina-se sumariamente os capitais pela lei de subordinação (Waterfall).

1. **Permuta de Terreno Financeira/Física:** Drena primeiro através do trâmite de Direito sob o `% garantido de Repasse/Recebíveis da Venda`.
2. **Fechamento de Empreiteiras/Caixa:** Subtrair explicitamente todo o rombo consumado da obra deste mês em evidência (Calculado no Passo 2).  
3. **Despesa Passiva da Primeira-Linha da Dívida:** Arcar compulsoriamente com o `Custo Financeiro dos Juros Puros` estipulados via taxas (CDI, INCC, etc) para a linha de crédito. Ocorrem duas rotas de destino se essa rubrica não puder ser completamente coberta em caixa:
   - Os Juros *não-pagos* somam ao montante total da dívida (`PIK`/Capitalização). 
   - A requisição imediata por Aporte da Matriz de Sócios incide se o saldo entrar no vermelho (Fluxo de capital out-of-pocket).
4. **Varrimento Compulsório (Amortização - Cash-Sweep):** Se ocorrido no pós-obra ou Repasse, todo o caixa redundante e ocioso, deduzidos os requisitos de folga, migram imediatamente para destruir a barra principal da dívida de `Financiamento Bancário`.
5. **Permuta (Sweep-Secundário Subordinado):** Caso o Financiamento à Construção derrete sumariamente abaixo de R$ 0,00 e haja caixa restante, ele passa a dilacerar o passivo subordinado restante da referida Permuta.

### Passo 6: Exaustão Lógica do Fluxo de Sócios e Valuation Final (NAV)
Ao fim das linhas contábeis daquele Mês:
- Se sobrou caixa líquido ocioso na SPE sem obrigações financeiras remanescentes da cascata (típico perto dos meses finais dos Repasses), a operação reconhece uma **Distribuição Positiva (`Fluxo de Capital Positivo`)**.
- Caso a subordinação de pagamentos engoliu os fundos até uma faixa liminar insalubre (menor que o caixa estipulado mínimo R$0), reconhece-se o **Aporte Negativo (`Fluxo de Capital Negativo`)**.
- A equação agregada `Fluxo Acumulado` ao fim de todo cronograma (Descontada ou Nominal com os devidos *Discount Factors* ponderados pela taxa de sacrifício do projeto de endividamento mensal) devolve o prêmio ou a derrota global do construtor: O **NAV (Net Asset Value)** do Empreendimento.
