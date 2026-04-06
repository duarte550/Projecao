import { ProjectInput } from './src/types';
import { runSimulation } from './src/lib/calculations';

const project: ProjectInput = {
  id: '1',
  empresa: 'Antigravity',
  nome: 'Projeto A',
  padrao: 'Alto',
  dataLancamento: new Date('2024-01-01'),
  dataInicioObras: new Date('2024-06-01'),
  percVendas: 0,
  vgvTotal: 100000000,
  percObras: 0,
  custoAIncorrer: 50000000,
  custoIncorrido: 0,
  preChavesRecebido: 0,
  preChavesAReceberAtual: 0,
  posChavesAReceberAtual: 0,
  estoqueAtual: 100000000,
  numeroUnidades: 100,
  posicaoCaixa: 500000,
  saldoFinanciamentoLiberado: 0,
  saldoFinanciamentoTotal: 30000000,
  dataEstimadaEntrega: new Date('2026-12-01'),
  vendasPercSinal: 0.1,
  vendasPercPreChaves: 0.15,
  vendasPercPosChaves: 0.75,
  finTaxaAnual: 0.12,
  finIndexador: 'CDI',
  finPercFinanciamento: 0.6,
  permutaTaxaAnual: 0.05,
  permutaIndexador: 'INCC',
  permutaSaldoInicio: 0,
  permutaPercRecebiveis: 0,
  salesProjectionMode: 'linear',
};

const macros = [{
  mesAno: new Date('2024-01-01'),
  incc: 0.05,
  cdi: 0.10,
  ipca: 0.045,
  tr: 0.02
}];

const baseDate = new Date('2024-01-01');

const res = runSimulation(project, { 
  costOverrun: 0.2, 
  delayMonths: 6, 
  salesSpeedMultiplier: 1, 
  discountStock: 0.1, 
  brokerageFee: 0.06,
  carregoBaixo: 20,
  carregoMedio: 25,
  carregoAlto: 28,
}, macros, baseDate);

console.log("NAV:", res.metrics.nav);
console.log("NAV Discounted:", res.metrics.navDiscounted);
