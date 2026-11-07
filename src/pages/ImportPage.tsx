import { AlertCircle, Armchair, CheckCircle2, Download, FileSpreadsheet, FileUp, Link2, UploadCloud } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { parseFurnitureList } from '../domain/furniture';
import type { ImportRow } from '../domain/types';
import { useApp } from '../state/AppContext';
import { Notice, PageHeader } from '../components/ui';

const headers = [
  'expositor',
  'responsavel',
  'email',
  'stand',
  'pavilhao',
  'metragem',
  'classificacao',
  'link_projeto',
  'link_memorial',
  'mobiliario',
];

export function ImportPage() {
  const { importExhibitors } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [imported, setImported] = useState<number | null>(null);

  const validRows = useMemo(() => rows.filter((row) => row.exhibitorName && row.stand && row.responsibleEmail.includes('@')), [rows]);

  const openFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setImported(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseSpreadsheetCsv(String(reader.result ?? ''));
      setRows(result.rows);
      setErrors(result.errors);
    };
    reader.readAsText(file, 'utf-8');
  };

  const downloadTemplate = () => {
    const example = [
      headers.join(';'),
      'Aurora Tech;Marina Alves;marina@empresa.com;B124;Pavilhão 2;96;AAA;https://drive.google.com/projeto;https://drive.google.com/memorial;3 cadeiras DKR / 1 mesa DKR / 1 lixeira / 1 TV de 43pol',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([example], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'modelo-importacao-expositores.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const confirmImport = () => {
    const count = importExhibitors(validRows);
    setImported(count);
  };

  return <>
    <PageHeader title="Importar expositores" description="Carregue a base da feira em lote e valide os dados antes de gravar." actions={<button className="button button-ghost" onClick={downloadTemplate}><Download size={17} /> Baixar modelo CSV</button>} />
    <section className="import-steps"><span className={rows.length ? 'done' : 'active'}><b>1</b> Enviar planilha</span><i /><span className={rows.length ? 'active' : ''}><b>2</b> Validar dados</span><i /><span className={imported !== null ? 'done' : ''}><b>3</b> Definir responsabilidades</span></section>
    {imported !== null && <Notice title={`${imported} expositores importados`} tone="success">Agora você pode vincular fornecedores e equipes pela matriz de responsabilidades.</Notice>}
    {!rows.length ? <section className="panel upload-panel" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); openFile(event.dataTransfer.files[0]); }}>
      <span className="upload-icon"><UploadCloud /></span><h2>Arraste a planilha para cá</h2><p>Use um arquivo CSV exportado do Excel ou Google Sheets. Os links do Drive serão mantidos nos cadastros.</p><button className="button button-primary" onClick={() => fileRef.current?.click()}><FileUp size={17} /> Escolher arquivo</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => openFile(event.target.files?.[0])} />
      <div className="upload-features"><span><FileSpreadsheet /> Até 500 expositores por lote</span><span><Link2 /> Projeto e memorial por link</span><span><Armchair /> Mobiliário separado por / ou vírgula</span></div>
    </section> : <>
      <section className="panel import-summary"><div><span className="file-badge"><FileSpreadsheet /></span><div><strong>{fileName}</strong><small>{rows.length} linhas encontradas · {validRows.length} válidas</small></div></div><button className="text-button" onClick={() => { setRows([]); setErrors([]); }}>Trocar arquivo</button></section>
      {errors.length > 0 && <div className="notice notice-danger"><AlertCircle /><div><strong>{errors.length} pontos precisam de atenção</strong><span>{errors.slice(0, 3).join(' · ')}</span></div></div>}
      <section className="panel import-preview"><div className="panel-header compact"><div><div><h2>Pré-visualização</h2><p>Confira os principais campos antes de importar</p></div></div><button className="button button-primary" disabled={!validRows.length || imported !== null} onClick={confirmImport}><CheckCircle2 size={17} /> Importar {validRows.length} expositores</button></div><div className="queue-table-wrap"><table className="data-table import-preview-table"><thead><tr><th>Status</th><th>Expositor</th><th>Responsável</th><th>Stand</th><th>Metragem</th><th>Classe interna</th><th>Mobiliário</th><th>Documentos</th></tr></thead><tbody>{rows.slice(0, 20).map((row, index) => { const valid = row.exhibitorName && row.stand && row.responsibleEmail.includes('@'); return <tr key={`${row.exhibitorName}-${index}`}><td>{valid ? <span className="valid-row"><CheckCircle2 /> Válida</span> : <span className="invalid-row"><AlertCircle /> Revisar</span>}</td><td><strong>{row.exhibitorName || '—'}</strong></td><td>{row.responsibleName}<small className="table-subtext">{row.responsibleEmail}</small></td><td>{row.pavilion}<small className="table-subtext">{row.stand}</small></td><td>{row.areaSqm || 0} m²</td><td><span className="tier-badge">{row.tier}</span></td><td><div className="import-furniture-list">{row.furniture.length ? row.furniture.map((item, itemIndex) => <span key={`${item.type}-${itemIndex}`}><b>{item.quantity}×</b> {item.type}</span>) : <small>Sem itens</small>}</div></td><td>{row.projectUrl ? 'Projeto' : '—'}{row.memorialUrl ? ' · Memorial' : ''}</td></tr>; })}</tbody></table></div></section>
    </>}
  </>;
}

function parseSpreadsheetCsv(content: string): { rows: ImportRow[]; errors: string[] } {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { rows: [], errors: ['O arquivo está vazio.'] };
  const separator = lines[0].includes(';') ? ';' : ',';
  const normalizedHeaders = splitCsvLine(lines[0], separator).map((item) => normalizeHeader(item));
  const missing = headers.filter((required) => !normalizedHeaders.includes(required) && !['link_projeto', 'link_memorial'].includes(required));
  const errors = missing.length ? [`Colunas obrigatórias ausentes: ${missing.join(', ')}`] : [];
  const indexOf = (name: string) => normalizedHeaders.indexOf(name);
  const value = (columns: string[], name: string) => columns[indexOf(name)]?.trim() ?? '';
  const validTiers = new Set(['AAA', 'AA', 'A', 'B', 'C']);
  const rows = lines.slice(1).map((line, rowIndex) => {
    const columns = splitCsvLine(line, separator);
    const tierValue = value(columns, 'classificacao').toUpperCase();
    const furnitureIndex = indexOf('mobiliario');
    const furnitureValue = furnitureIndex >= 0 ? columns.slice(furnitureIndex).join(separator) : '';
    const row: ImportRow = {
      exhibitorName: value(columns, 'expositor'),
      responsibleName: value(columns, 'responsavel'),
      responsibleEmail: value(columns, 'email'),
      stand: value(columns, 'stand'),
      pavilion: value(columns, 'pavilhao'),
      areaSqm: Number(value(columns, 'metragem').replace(',', '.')) || 0,
      tier: validTiers.has(tierValue) ? (tierValue as ImportRow['tier']) : 'C',
      projectUrl: value(columns, 'link_projeto') || undefined,
      memorialUrl: value(columns, 'link_memorial') || undefined,
      furniture: parseFurnitureList(furnitureValue),
    };
    if (!row.exhibitorName || !row.stand || !row.responsibleEmail.includes('@')) errors.push(`Linha ${rowIndex + 2} incompleta`);
    return row;
  });
  return { rows, errors };
}

function splitCsvLine(line: string, separator: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (character === separator && !quoted) { values.push(current); current = ''; }
    else current += character;
  }
  values.push(current);
  return values;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_');
}
