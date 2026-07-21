export const exportarDashboardPDF = async () => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Dashboard CRM - DESEO DIGITAL', 14, 16);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 24);
    doc.text('Resumen', 14, 34);
    doc.text('- Proyectos activos: consultar en /proyectos', 14, 42);
    doc.text('- Facturación: consultar en /facturacion', 14, 50);
    doc.text('- Contratos: consultar en /contratos', 14, 58);
    doc.save('dashboard-crm.pdf');
    return { ok: true as const, path: 'dashboard-crm.pdf' };
  } catch (e) {
    return { ok: false as const, error: e };
  }
};

export const exportarDashboardExcel = async () => {
  try {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Dashboard');
    sheet.getCell('A1').value = 'Dashboard CRM - DESEO DIGITAL';
    sheet.getCell('A2').value = `Fecha: ${new Date().toLocaleString()}`;
    sheet.getCell('A4').value = 'Sección';
    sheet.getCell('B4').value = 'Ruta';
    sheet.getCell('A5').value = 'Proyectos';
    sheet.getCell('B5').value = '/proyectos';
    sheet.getCell('A6').value = 'Facturación';
    sheet.getCell('B6').value = '/facturacion';
    sheet.getCell('A7').value = 'Contratos';
    sheet.getCell('B7').value = '/contratos';
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-crm.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true as const, path: 'dashboard-crm.xlsx' };
  } catch (e) {
    return { ok: false as const, error: e };
  }
};
