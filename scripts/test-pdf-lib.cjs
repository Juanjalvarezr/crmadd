const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function test() {
  console.log('=== pdf-lib Test ===');
  
  try {
    // Crear documento (PDFDocument.create devuelve una promesa)
    const doc = await PDFDocument.create();
    console.log('✅ Documento creado');
    
    // Añadir página con tamaño A4
    const pageSize = [595.28, 841.89]; // A4 en puntos
    const page = doc.addPage(pageSize);
    console.log('✅ Página añadida — tamaño A4:', pageSize[0], 'x', pageSize[1]);
    
    // Embed font
    const font = await doc.embedFont(StandardFonts.Helvetica);
    console.log('✅ Fuente Helvetica embebida');
    
    // Dibujar texto
    page.drawText('Hola Deseo Digital', {
      x: 50,
      y: 750,
      size: 24,
      font: font,
    });
    console.log('✅ Texto dibujado');
    
    // Guardar
    const pdfBytes = await doc.save();
    console.log('✅ PDF generado — tamaño:', pdfBytes.length, 'bytes');
    
    // Guardar a archivo
    fs.writeFileSync('test.pdf', pdfBytes);
    console.log('✅ PDF guardado como test.pdf');
    
    // Verificar archivo
    const stats = fs.statSync('test.pdf');
    console.log('✅ Archivo existe — tamaño:', stats.size, 'bytes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
