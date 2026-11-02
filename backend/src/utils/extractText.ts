// Reads plain text out of supported uploads (SRS 3.1: PDF and DOC/DOCX primary,
// spreadsheets where needed). Returns null when the format can't be read
// automatically (legacy .doc/.xls, scanned PDFs with no text layer).

const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const MAX_EXTRACT_CHARS = 60000;

function htmlToMarkdownWithTables(html: string): string {
  // 1. Process <table>...</table> into markdown tables
  let result = html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_match, tableContent) => {
    const rows: string[][] = [];
    const trMatches = tableContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const tr of trMatches) {
      const cells: string[] = [];
      const cellMatches = tr.match(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
      for (const cell of cellMatches) {
        const text = cell
          .replace(/<(th|td)[^>]*>/gi, '')
          .replace(/<\/(th|td)>/gi, '')
          .replace(/<[^>]+>/g, '') // remove inner tags
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(text.replace(/\|/g, '\\|'));
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    if (rows.length === 0) return '';

    const maxCols = Math.max(...rows.map((r) => r.length));
    const normalizedRows = rows.map((r) => {
      const copy = [...r];
      while (copy.length < maxCols) copy.push('');
      return copy;
    });

    const lines: string[] = [];
    // Header
    lines.push(`| ${normalizedRows[0].join(' | ')} |`);
    lines.push(`| ${normalizedRows[0].map(() => '---').join(' | ')} |`);
    // Body
    for (let i = 1; i < normalizedRows.length; i++) {
      lines.push(`| ${normalizedRows[i].join(' | ')} |`);
    }
    return `\n\n${lines.join('\n')}\n\n`;
  });

  // 2. Process list items
  result = result.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, content) => {
    return `\n• ${content.replace(/<[^>]+>/g, '').trim()}`;
  });

  // 3. Process paragraphs and headers
  result = result.replace(/<br\s*\/?>/gi, '\n');
  result = result.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  result = result.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n$1\n\n');

  // 4. Strip leftover tags
  result = result.replace(/<[^>]+>/g, '');

  // 5. Unescape HTML entities
  result = result
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return result;
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string | null> {
  try {
    let text: string | null = null;

    if (mimeType === PDF) {
      // Import the inner file: pdf-parse's index.js runs a debug routine on require.
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as string)).default;
      text = (await pdfParse(buffer)).text;
    } else if (mimeType === DOCX) {
      const mammoth = await import('mammoth');
      // Convert to HTML first to preserve table tags and structure
      const htmlResult = await mammoth.convertToHtml({ buffer });
      if (htmlResult.value && htmlResult.value.includes('<table')) {
        text = htmlToMarkdownWithTables(htmlResult.value);
      } else {
        text = (await mammoth.extractRawText({ buffer })).value;
      }
    } else if (mimeType === XLSX) {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const lines: string[] = [];
      wb.eachSheet((ws) => {
        lines.push(`\n## Sheet: ${ws.name}\n`);
        let isFirstRow = true;
        let columnCount = 0;

        ws.eachRow((row) => {
          const cells = (row.values as unknown[])
            .slice(1)
            .map((v) => (v == null ? '' : String(v).trim().replace(/\|/g, '\\|')));

          if (cells.some((c) => c.length > 0)) {
            if (isFirstRow) {
              columnCount = cells.length;
              lines.push(`| ${cells.join(' | ')} |`);
              lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
              isFirstRow = false;
            } else {
              const padded = [...cells];
              while (padded.length < columnCount) padded.push('');
              lines.push(`| ${padded.slice(0, columnCount).join(' | ')} |`);
            }
          }
        });
      });
      text = lines.join('\n');
    }

    if (!text) return null;
    text = text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    return text.length ? text.slice(0, MAX_EXTRACT_CHARS) : null;
  } catch (err) {
    console.error('extractText failed:', err);
    return null;
  }
}
