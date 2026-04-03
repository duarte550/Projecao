---
trigger: always_on
---

Anotações para o prompt do modelo:
Conceito geral do modelo: Gostaria de montar um modelo que me auxiliasse a averiguar a saúde financeira de projetos de incorporação que estamos financiando. Para isso, temos uma série de inputs da foto atual do projeto, inputs macro e gostaríamos de saber qual o risco dessa operação, caso ela não ocorra como esperado. Os inputs devem vir de uma planilha com uma aba com todos os inputs de vários projetos e outra aba com os inputs macro. O resultado deve ser uma planilha organizada ou um dashboard, que nos permita ver todos os projetos lado a lado e uma pagina de cada projeto com suas informações calculadas e curva mensal esperada. Devemos já estruturar o projeto, pensando em conseguir ter impactos possíveis nas vendas, sobrecusto, atraso de obras e descontos nas unidades, para conseguirmos simular como se fosse um monte carlo.

Inputs do projeto:
•	Empresa
•	Nome do projeto
•	Padrão (Médio ou alto padrão)
•	Data de lançamento
•	Data de inicio de obras
•	% vendas
•	VGV Total
•	% de obras
•	Custo a incorrer
•	Custo incorrido
•	Pré-chaves recebido
•	Pré-chaves a receber atual
•	Pós-chaves a receber atual
•	Estoque Atual
•	Numero de unidades 
•	Metragem média das unidades (não obrigatório)
•	Posição de Caixa da SPE
•	Saldo do Financiamento atual liberado
•	Saldo do financiamento total
•	Data estimada de entrega
•	Vendas:
o	%recebido de sinal (no mesmo mês)
o	% pré-chaves
o	% pós-chaves
Inputs da dívida: Existem dois tipos possíveis de dívida para um projeto, sendo que dependendo do projeto ele pode ter os dois: Financiamento à construção e Permuta
•	Financiamento à construção:
o	Taxa anual
o	Indexador
o	% de financiamento do projeto (exemplo 30% do custo será de equity no projeto e 70% de divida)
o	Desembolso para reembolso do equity investido pelo incorporador. Isto é, o saldo vai aumentando na medida que o incorporador precisa de recursos para as obras
o	Juros pagos mensalmente
o	Tem prioridade no recebimento dos repasses
•	Permuta:
o	Taxa Anual
o	Indexador
o	Saldo no inicio do projeto ou da projeção
o	Accrua juros mensal
o	% de permuta dos recebíveis: tem um direito a um % dos recebíveis mensais do projeto pré-chaves
o	É subordinado ao Financiamento à construção no repasse, mas tem prioridade ao equity
Inputs Macro:
•	Curva de INCC
•	Curva de CDI
•	Curva ótima para os projetos:
o	Essa curva relaciona o % de obras com o % vendido de cada projeto. E o projeto sempre será considerado como “ok”, caso a combinação do nível atual de obras e vendas esteja em cima dessa linha ou à direita dela. Isto é, as vendas estarem maiores do que a evolução de obras prevista na curva
o	Curva esperada sendo x: % vendido e y: % de obras
	Se x<30%: y = 0 
	Se 30%<= x< 35%: y = 1,7866x -0,5326
	Se 35%<= x < 55%: y = 3,0136x -0,9617
	Se x> 55%: y = 1,0313x + 0,1335

Outputs de interesse:
•	NAV de cada projeto
•	O quanto de juros o cara tem que pagar durante o projeto (ou seja, os recebíveis do projeto não são o suficiente para pagar os juros, devemos ter uma visão mensal e acumulada de quanto foram esses desembolsos)
•	Índice de cobertura final
•	Quanto de estoque vai faltar no final
•	O quanto de desconto poderíamos dar antes de NAV negativo
Lógica geral por projeto:
•	Calculamos os recebíveis mensais e o custo mensal estimado para a obra (%permuta -> custo da obra -> juros de financiamento. O custo total é a soma desses três, nessa ordem de prioridade), caso os recebíveis não sejam suficientes para pagar todos os custos do mês e ainda exista saldo a liberar do financiamento à construção, deve-se “liberar” mais saldo de financiamento. Isto é, o saldo de financiamento deve aumentar
•	Após a data de conclusão prevista para o projeto, temos o prazo de três meses para começo do recebimento dos repasses das unidades vendidas, 6 meses para conclusão do recebimento dos repasses e 12 meses para venda dos estoques com desconto médio que pode ser definido pelo usuário, mas que deve começar em 10%
•	Prioridade de recebimento de repasse: Financiamento a construção -> permuta -> equity



