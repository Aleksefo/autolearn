export type CsvPairRow = {
  term: string;
  definition: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

const HEADER = ['term', 'definition', 'sourceLanguage', 'targetLanguage'];

const escapeField = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

export function serializePairsToCsv(rows: CsvPairRow[]): string {
  const lines = rows.map(row =>
    [
      row.term,
      row.definition,
      row.sourceLanguage ?? '',
      row.targetLanguage ?? '',
    ]
      .map(escapeField)
      .join(','),
  );
  return [HEADER.join(','), ...lines].join('\n');
}

// Minimal RFC-4180-style parser: quoted fields, escaped quotes, CRLF.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Accepts `term,definition[,sourceLanguage,targetLanguage]` rows; a leading
// header row is skipped; rows without both term and definition are dropped.
export function parsePairsCsv(text: string): CsvPairRow[] {
  const rows = parseCsv(text);
  return rows
    .filter((cells, index) => {
      if (index === 0 && cells[0]?.trim().toLowerCase() === 'term') {
        return false;
      }
      return (cells[0]?.trim() ?? '') !== '' && (cells[1]?.trim() ?? '') !== '';
    })
    .map(cells => ({
      term: cells[0].trim(),
      definition: cells[1].trim(),
      sourceLanguage: cells[2]?.trim() || undefined,
      targetLanguage: cells[3]?.trim() || undefined,
    }));
}
