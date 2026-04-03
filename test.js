const XLSX = require('xlsx');
const wb = XLSX.readFile('MemoryCard_IncorpRisk.xlsx', { cellDates: true });
const wsProjects = wb.Sheets['Projetos'];
const wsPremissas = wb.Sheets['Premissas'];
const rawProjects = XLSX.utils.sheet_to_json(wsProjects);
console.log('Project 0:', rawProjects[0]);
console.log('Premissas:', XLSX.utils.sheet_to_json(wsPremissas));
