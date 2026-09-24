export type Celula = string | number;

export interface SecaoRelatorio {
  titulo: string;
  cabecalho: string[];
  linhas: Celula[][];
}

export interface DocumentoRelatorio {
  arquivo: string;
  titulo: string;
  filtros: string[];
  secoes: SecaoRelatorio[];
}

function baixar(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escaparCsv(valor: Celula): string {
  const texto = String(valor ?? '');
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function exportarCsv(doc: DocumentoRelatorio): void {
  const linhas: Celula[][] = [[doc.titulo], ...doc.filtros.map((f) => [f]), []];

  doc.secoes.forEach((secao) => {
    if (doc.secoes.length > 1) linhas.push([secao.titulo]);
    linhas.push(secao.cabecalho, ...secao.linhas, []);
  });

  const conteudo = linhas.map((l) => l.map(escaparCsv).join(';')).join('\r\n');
  baixar(new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' }), `${doc.arquivo}.csv`);
}

export async function exportarXlsx(doc: DocumentoRelatorio): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();

  doc.secoes.forEach((secao, indice) => {
    const nomeAba = secao.titulo.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Aba ${indice + 1}`;
    const ws = wb.addWorksheet(nomeAba);

    ws.addRow([doc.titulo]).font = { bold: true, size: 14, name: 'Arial' };
    doc.filtros.forEach((f) => (ws.addRow([f]).font = { size: 10, name: 'Arial', color: { argb: 'FF6B6280' } }));
    ws.addRow([]);

    const cab = ws.addRow(secao.cabecalho);
    cab.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 11 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B3FD4' } };
    });
    secao.linhas.forEach((l) => (ws.addRow(l).font = { name: 'Arial', size: 10 }));

    secao.cabecalho.forEach((_, i) => {
      const maior = Math.max(secao.cabecalho[i].length, ...secao.linhas.map((l) => String(l[i] ?? '').length));
      ws.getColumn(i + 1).width = Math.min(Math.max(maior + 3, 12), 60);
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  baixar(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${doc.arquivo}.xlsx`,
  );
}

export async function exportarPdf(doc: DocumentoRelatorio): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const margem = 40;
  let y = margem;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(107, 63, 212);
  pdf.text(doc.titulo, margem, y);
  y += 20;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(90, 84, 110);
  doc.filtros.forEach((f) => {
    pdf.text(f, margem, y);
    y += 14;
  });
  y += 6;

  doc.secoes.forEach((secao) => {
    if (doc.secoes.length > 1) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(32, 18, 56);
      pdf.text(secao.titulo, margem, y + 4);
      y += 10;
    }

    autoTable(pdf, {
      startY: y,
      head: [secao.cabecalho],
      body: secao.linhas.map((l) => l.map((c) => String(c))),
      margin: { left: margem, right: margem },
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [107, 63, 212] },
      alternateRowStyles: { fillColor: [246, 244, 252] },
    });

    y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  });

  const paginas = pdf.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(140, 134, 160);
    pdf.text(`Página ${i} de ${paginas}`, pdf.internal.pageSize.getWidth() - margem, pdf.internal.pageSize.getHeight() - 20, { align: 'right' });
  }

  pdf.save(`${doc.arquivo}.pdf`);
}
