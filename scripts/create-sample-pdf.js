import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'

async function createSamplePDF() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()

  // Header
  page.drawText('WOO-VERZOEK 2024-001', {
    x: 50,
    y: height - 50,
    size: 18,
    font: boldFont,
    color: rgb(0, 0, 0),
  })

  page.drawText('Betreft: Verzoek openbaarmaking documenten', {
    x: 50,
    y: height - 80,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  })

  // Date
  page.drawText('Datum: 15 januari 2024', {
    x: 50,
    y: height - 120,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  })

  // Content with PII
  const content = [
    'Geachte heer/mevrouw,',
    '',
    'Hierbij doe ik een beroep op de Wet open overheid (Woo) en verzoek ik u om',
    'openbaarmaking van de volgende documenten:',
    '',
    '1. Alle correspondentie met Andreas Gal betreffende het TraceMoneky project',
    '2. E-mails verzonden naar agal@mozilla.com in de periode januari-maart 2024',
    '3. Telefoongesprekken gevoerd met 1-650-903-0800',
    '4. Documenten betreffende Mountain View, CA vestiging',
    '5. Alle communicatie met Brendan Eich over JavaScript ontwikkeling',
    '',
    'Contactgegevens aanvrager:',
    'Jan Janssen',
    'Postbus 12345',
    '1234 AB Amsterdam',
    'Telefoon: 06-12345678',
    'E-mail: jan.janssen@email.nl',
    'BSN: 123456789',
    '',
    'Ik verzoek u vriendelijk dit verzoek binnen de wettelijke termijn van vier weken',
    'te behandelen zoals voorgeschreven in artikel 5.1 van de Woo.',
    '',
    'Met vriendelijke groet,',
    'Jan Janssen'
  ]

  let yPosition = height - 160
  content.forEach(line => {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    })
    yPosition -= 20
  })

  // Footer
  page.drawText('Dit document bevat persoonsgegevens die geanonimiseerd moeten worden conform de Woo.', {
    x: 50,
    y: 50,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })

  const pdfBytes = await pdfDoc.save()
  
  // Save to public/samples
  fs.writeFileSync('public/samples/woo-verzoek-2024-001.pdf', pdfBytes)
  console.log('✅ Sample PDF created: public/samples/woo-verzoek-2024-001.pdf')
}

createSamplePDF().catch(console.error) 