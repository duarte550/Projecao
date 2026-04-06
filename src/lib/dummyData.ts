import { ProjectInput } from '../types';

export const dummyProjects: ProjectInput[] = [
  {
    id: '1',
    empresa: 'Nova Era Inc.',
    nome: 'Empreendimento Aurora',
    padrao: 'Médio',
    dataLancamento: new Date('2025-10-01'),
    dataInicioObras: new Date('2026-01-01'),
    dataEstimadaEntrega: new Date('2028-07-01'), // 30 meses de obra total
    percVendas: 0.35,
    percObras: 0.04, // Ritmo saudável, apenas no início (4%)
    vgvTotal: 120000000,
    custoIncorrido: 2000000,
    custoAIncorrer: 43000000, // Custo Total: 45M (37% do VGV)
    numeroUnidades: 120,
    metragemMedia: 80,
    preChavesRecebido: 4500000,
    preChavesAReceberAtual: 6300000,
    posChavesAReceberAtual: 31500000,
    estoqueAtual: 78000000,
    posicaoCaixa: 2500000,
    saldoFinanciamentoTotal: 36000000, // 80% do Custo Total
    saldoFinanciamentoLiberado: 1500000,
    finTaxaAnual: 0.11,
    finIndexador: 'CDI',
    finPercFinanciamento: 0.8,
    permutaSaldoInicio: 12000000, // 10% do VGV Total
    permutaTaxaAnual: 0,
    permutaIndexador: 'INCC',
    permutaPercRecebiveis: 0.10,
    vendasPercSinal: 0.10,
    vendasPercPreChaves: 0.15,
    vendasPercPosChaves: 0.75,
    outrosCustosVgvTerc1: 0.06,
    outrosCustosVgvTerc2: 0.04,
    outrosCustosVgvTerc3: 0.02,
    custoJuridicoObra: 15000,
    custoJuridicoPosObra: 5000,
  },
  {
    id: '2',
    empresa: 'Horizonte Fundo',
    nome: 'Residencial Horizonte',
    padrao: 'Alto',
    dataLancamento: new Date('2024-05-01'),
    dataInicioObras: new Date('2024-08-01'),
    dataEstimadaEntrega: new Date('2027-08-01'), // 36 meses de obra total
    percVendas: 0.60,
    percObras: 0.50, // No meio da obra
    vgvTotal: 80000000,
    custoIncorrido: 17500000,
    custoAIncorrer: 17500000, // Custo Total: 35M
    numeroUnidades: 60,
    metragemMedia: 150,
    preChavesRecebido: 7000000,
    preChavesAReceberAtual: 4500000,
    posChavesAReceberAtual: 33600000,
    estoqueAtual: 32000000,
    posicaoCaixa: 3000000,
    saldoFinanciamentoTotal: 28000000, // 80% do Custo Total
    saldoFinanciamentoLiberado: 14000000,
    finTaxaAnual: 0.12,
    finIndexador: 'CDI',
    finPercFinanciamento: 0.8,
    permutaSaldoInicio: 12000000, // 15% do VGV Total
    permutaTaxaAnual: 0,
    permutaIndexador: 'INCC',
    permutaPercRecebiveis: 0.10,
    vendasPercSinal: 0.10,
    vendasPercPreChaves: 0.20,
    vendasPercPosChaves: 0.70,
    outrosCustosVgvTerc1: 0.06,
    outrosCustosVgvTerc2: 0.04,
    outrosCustosVgvTerc3: 0.02,
    custoJuridicoObra: 15000,
    custoJuridicoPosObra: 5000,
  },
  {
    id: '3',
    empresa: 'Gama Construções',
    nome: 'Edifício Splendor',
    padrao: 'Alto',
    dataLancamento: new Date('2023-02-01'),
    dataInicioObras: new Date('2023-08-01'),
    dataEstimadaEntrega: new Date('2026-08-01'), // 36 meses, fase final
    percVendas: 0.85,
    percObras: 0.90, // Fim de obra, ritmo excelente
    vgvTotal: 150000000,
    custoIncorrido: 54000000,
    custoAIncorrer: 6000000, // Custo Total: 60M
    numeroUnidades: 80,
    metragemMedia: 220,
    preChavesRecebido: 20000000,
    preChavesAReceberAtual: 5500000,
    posChavesAReceberAtual: 95600000,
    estoqueAtual: 22500000,
    posicaoCaixa: 8000000,
    saldoFinanciamentoTotal: 48000000, // 80% do Custo Total
    saldoFinanciamentoLiberado: 43000000,
    finTaxaAnual: 0.10,
    finIndexador: 'CDI',
    finPercFinanciamento: 0.8,
    permutaSaldoInicio: 0, // Sem permuta (terreno pago)
    permutaTaxaAnual: 0,
    permutaIndexador: 'INCC',
    permutaPercRecebiveis: 0,
    vendasPercSinal: 0.10,
    vendasPercPreChaves: 0.15,
    vendasPercPosChaves: 0.75,
    outrosCustosVgvTerc1: 0.06,
    outrosCustosVgvTerc2: 0.04,
    outrosCustosVgvTerc3: 0.02,
    custoJuridicoObra: 15000,
    custoJuridicoPosObra: 5000,
  },
  {
    id: '4',
    empresa: 'Vanguard Realty',
    nome: 'Plaza das Vistas',
    padrao: 'Médio',
    dataLancamento: new Date('2024-03-01'),
    dataInicioObras: new Date('2024-06-01'),
    dataEstimadaEntrega: new Date('2027-06-01'), // 36 meses
    percVendas: 0.20, // MUITO ABAIXO do esperado (Estresse Comercial)
    percObras: 0.60, // Obra avançada demais para o nível de vendas
    vgvTotal: 90000000,
    custoIncorrido: 22800000,
    custoAIncorrer: 15200000, // Custo Total: 38M
    numeroUnidades: 150,
    metragemMedia: 65,
    preChavesRecebido: 1800000,
    preChavesAReceberAtual: 2000000,
    posChavesAReceberAtual: 14000000,
    estoqueAtual: 72000000,
    posicaoCaixa: 400000, // Caixa raso
    saldoFinanciamentoTotal: 30400000, // 80% de 38M
    saldoFinanciamentoLiberado: 20000000,
    finTaxaAnual: 0.14,
    finIndexador: 'CDI',
    finPercFinanciamento: 0.8,
    permutaSaldoInicio: 18000000, // 20% do VGV (Elevado)
    permutaTaxaAnual: 0,
    permutaIndexador: 'INCC',
    permutaPercRecebiveis: 0.20,
    vendasPercSinal: 0.10,
    vendasPercPreChaves: 0.15,
    vendasPercPosChaves: 0.75,
    outrosCustosVgvTerc1: 0.06,
    outrosCustosVgvTerc2: 0.04,
    outrosCustosVgvTerc3: 0.02,
    custoJuridicoObra: 15000,
    custoJuridicoPosObra: 5000,
  },
  {
    id: '5',
    empresa: 'Prime Builders',
    nome: 'High Line Residencial',
    padrao: 'Alto',
    dataLancamento: new Date('2024-01-01'),
    dataInicioObras: new Date('2024-03-01'),
    dataEstimadaEntrega: new Date('2026-09-01'), // 30 meses de duração (Atrasado fisicamente)
    percVendas: 0.55,
    percObras: 0.20, // APENAS 20% - Obra extremamente atrasada fisicamente
    vgvTotal: 75000000,
    custoIncorrido: 6000000,
    custoAIncorrer: 24000000, // Custo Total: 30M
    numeroUnidades: 80,
    metragemMedia: 110,
    preChavesRecebido: 6000000,
    preChavesAReceberAtual: 6000000,
    posChavesAReceberAtual: 29000000,
    estoqueAtual: 33750000,
    posicaoCaixa: 5000000, // Bastante caixa de vendas esperando a obra andar
    saldoFinanciamentoTotal: 24000000, // 80% de 30M
    saldoFinanciamentoLiberado: 4000000, // Banco não libera por falta de andamento fisíco
    finTaxaAnual: 0.13,
    finIndexador: 'CDI',
    finPercFinanciamento: 0.8,
    permutaSaldoInicio: 5000000, // Baixa permuta
    permutaTaxaAnual: 0,
    permutaIndexador: 'INCC',
    permutaPercRecebiveis: 0.05,
    vendasPercSinal: 0.10,
    vendasPercPreChaves: 0.20,
    vendasPercPosChaves: 0.70,
    outrosCustosVgvTerc1: 0.06,
    outrosCustosVgvTerc2: 0.04,
    outrosCustosVgvTerc3: 0.02,
    custoJuridicoObra: 15000,
    custoJuridicoPosObra: 5000,
  },
  {
    id: '6',
    empresa: 'Babel Corp',
    nome: 'Torre de Babel (Estressado)',
    padrao: 'Médio',
    dataLancamento: new Date('2023-01-01'),
    dataInicioObras: new Date('2023-06-01'),
    dataEstimadaEntrega: new Date('2026-06-01'), // 36 meses
    percVendas: 0.40, // Vendas fracas
    percObras: 0.80, // Construído muito rápido sem vender
    vgvTotal: 100000000,
    custoIncorrido: 33600000,
    custoAIncorrer: 8400000, // Custo Total: 42M
    numeroUnidades: 150,
    metragemMedia: 60,
    preChavesRecebido: 5000000,
    preChavesAReceberAtual: 3000000,
    posChavesAReceberAtual: 32000000, // Estagnou os repasses
    estoqueAtual: 60000000, // Estoque absurdo retido
    posicaoCaixa: 50000, // Quase zero
    saldoFinanciamentoTotal: 33600000, // 80% do Custo (Quase Maximizada a linha)
    saldoFinanciamentoLiberado: 30000000,
    finTaxaAnual: 0.15, // Custo punitivo alto
    finIndexador: 'CDI',
    finPercFinanciamento: 0.8,
    permutaSaldoInicio: 20000000, // Permuta no teto (20%) e tóxica
    permutaTaxaAnual: 0.08, // Corre juros
    permutaIndexador: 'INCC',
    permutaPercRecebiveis: 0.30, // Sangra 30% da conta (pesadelo cash flow)
    vendasPercSinal: 0.10,
    vendasPercPreChaves: 0.15,
    vendasPercPosChaves: 0.75,
    outrosCustosVgvTerc1: 0.06,
    outrosCustosVgvTerc2: 0.04,
    outrosCustosVgvTerc3: 0.02,
    custoJuridicoObra: 15000,
    custoJuridicoPosObra: 5000,
  }
];
