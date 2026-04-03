const XLSX = require('xlsx');

const parseNum = (val, fallback = 0) => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    let clean = val.replace(/[^\d,\.-]/g, '');
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
};

const parseDate = (val) => {
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'number') {
    const utc = Math.round((val - 25569) * 86400 * 1000);
    return new Date(utc + (new Date().getTimezoneOffset() * 60000));
  }
  if (typeof val === 'string') {
    const parts = val.split('/');
    if (parts.length === 3) {
      const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      if (!isNaN(date.getTime())) return date;
    }
    const dt = new Date(val);
    if (!isNaN(dt.getTime())) return dt;
  }
  return new Date();
};

const wb = XLSX.readFile('MemoryCard_IncorpRisk.xlsx', { cellDates: true });
const wsProjects = wb.Sheets['Projetos'];
const rawProjects = XLSX.utils.sheet_to_json(wsProjects);

let hasError = false;
rawProjects.forEach((row, i) => {
  try {
    const d1 = parseDate(row['Data de lançamento']);
    const d2 = parseDate(row['Data estimada de entrega']);
    const d3 = parseDate(row['Data de início das obras'] || row['Data de inicio das obras'] || row['Data de lançamento']);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || isNaN(d3.getTime())) {
      console.log('Project', i, 'INVALID DATE');
      hasError = true;
    }
  } catch(e) {
    console.log('Project', i, 'Error', e);
  }
});

const wsMacros = wb.Sheets['Macros'];
const rawMacros = XLSX.utils.sheet_to_json(wsMacros);
rawMacros.forEach((row, i) => {
  try {
    const d = parseDate(row['Mês/Ano']);
    if (isNaN(d.getTime())) {
      console.log('Macro', i, 'INVALID DATE');
      hasError = true;
    }
  } catch(e) {
    console.log('Macro', i, 'Error', e);
  }
});

const wsPremissas = wb.Sheets['Premissas'];
const rawPremissas = XLSX.utils.sheet_to_json(wsPremissas);
const dbRow = rawPremissas.find(r => r['Parâmetro'] === 'Data Base da Projeção' || r['Parâmetro'] === 'Data Base');
if(dbRow) {
  const d = parseDate(dbRow['Valor']);
  if (isNaN(d.getTime())) {
     console.log('Premissas INVALID DATE');
  }
}

console.log("Validation finished.");
