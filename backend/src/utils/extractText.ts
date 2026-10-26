// Reads plain text out of supported uploads (SRS 3.1: PDF and DOC/DOCX primary,
// spreadsheets where needed). Returns null when the format can't be read
// automatically (legacy .doc/.xls, scanned PDFs with no text layer).

const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const MAX_EXTRACT_CHARS = 60000;

export async function extractText(buffer: Buffer, mimeType: string): Promise<string | null> {
  try {
    let text: string | null = null;

    if (mimeType === PDF) {
      // Import the inner file: pdf-parse's index.js runs a debug routine on require.
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as string)).default;
      text = (await pdfParse(buffer)).text;
    } else if (mimeType === DOCX) {
      const mammoth = await import('mammoth');
      text = (await mammoth.extractRawText({ buffer })).value;
    } else if (mimeType === XLSX) {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const lines: string[] = [];
      wb.eachSheet((ws) => {
        lines.push(`# ${ws.name}`);
        ws.eachRow((row) => {
          const cells = (row.values as unknown[]).slice(1).map((v) => (v == null ? '' : String(v)));
          lines.push(cells.join('\t'));
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
