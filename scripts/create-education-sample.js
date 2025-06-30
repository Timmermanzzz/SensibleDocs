import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'

async function createEducationSamples() {
  console.log('🎓 Creating educational sample PDFs...')
  
  // Ensure samples directory exists
  if (!fs.existsSync('public/samples/education')) {
    fs.mkdirSync('public/samples/education', { recursive: true })
  }

  // 1. Student Report
  await createStudentReport()
  
  // 2. Parent Meeting Report
  await createParentMeetingReport()
  
  // 3. Psychological Evaluation
  await createPsychologicalEvaluation()
  
  console.log('✅ All educational samples created!')
}

async function createStudentReport() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()

  // Header
  page.drawText('LEERLINGRAPPORT 2024 - KWARTAAL 1', {
    x: 50,
    y: height - 50,
    size: 18,
    font: boldFont,
    color: rgb(0.12, 0.25, 0.69), // Education blue
  })

  page.drawText('Onderwijsinstelling: Het Groene College', {
    x: 50,
    y: height - 80,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  })

  // Student info (contains PII that needs anonymization)
  const studentInfo = [
    'LEERLINGGEGEVENS',
    '',
    'Naam: Emma van der Berg',
    'Studentnummer: 20240157',
    'Geboortedatum: 15 maart 2008',
    'Adres: Schoolstraat 42, 1234 AB Voorbeeld',
    'Telefoonnummer ouders: 06-12345678',
    'E-mail ouder: e.vandenberg@email.com',
    'Klas: 4B',
    'Mentor: Dhr. J. Janssen (j.janssen@hetgroenecollege.nl)',
    '',
    'RAPPORTCIJFERS PERIODE JANUARI - MAART 2024',
    '',
    'Nederlandse Taal: 7.2',
    'Wiskunde: 6.8',
    'Geschiedenis: 8.1',
    'Aardrijkskunde: 7.5',
    'Biologie: 6.9',
    'Scheikunde: 7.8',
    'Natuurkunde: 6.4',
    'Engels: 8.3',
    'Frans: 7.0',
    'Lichamelijke Opvoeding: 8.5',
    '',
    'GEMIDDELDE: 7.4',
    '',
    'GEDRAG EN WERKHOUDING',
    '',
    'Emma toont een positieve leerhouding en werkt goed samen.',
    'Aandachtspunten: Soms te druk tijdens lessen.',
    'Afwezigheid: 3 dagen (ziekte)',
    '',
    'OPMERKINGEN MENTOR',
    '',
    'Emma maakt een goede ontwikkeling door. Ze heeft moeite',
    'met concentratie tijdens wiskundeles. Advies: extra',
    'begeleiding bij huiswerk. Contact ouders gewenst.',
    '',
    'Handtekening mentor: J. Janssen',
    'Datum: 15 maart 2024',
    'Handtekening ouder: ________________'
  ]

  let yPosition = height - 120
  studentInfo.forEach((line, index) => {
    const isHeader = line === 'LEERLINGGEGEVENS' || line === 'RAPPORTCIJFERS PERIODE JANUARI - MAART 2024' || 
                    line === 'GEDRAG EN WERKHOUDING' || line === 'OPMERKINGEN MENTOR'
    
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: isHeader ? 12 : 10,
      font: isHeader ? boldFont : font,
      color: rgb(0, 0, 0),
    })
    yPosition -= isHeader ? 20 : 15
  })

  // Footer
  page.drawText('Dit rapport bevat privacy-gevoelige informatie die beschermd moet worden volgens de AVG.', {
    x: 50,
    y: 50,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  })

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('public/samples/education/leerling-rapport-2024-Q1.pdf', pdfBytes)
  console.log('✅ Student report created: leerling-rapport-2024-Q1.pdf')
}

async function createParentMeetingReport() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()

  // Header
  page.drawText('OUDER-DOCENT GESPREKVERSLAG', {
    x: 50,
    y: height - 50,
    size: 18,
    font: boldFont,
    color: rgb(0.12, 0.25, 0.69),
  })

  const content = [
    'Datum gesprek: 20 maart 2024',
    'Tijd: 14:00 - 14:30',
    '',
    'AANWEZIG',
    'Leerling: Lisa Bakker (klas 3A)',
    'Ouder(s): Mevr. S. Bakker-de Vries',
    'Docent: Dhr. M. Peters (Nederlands)',
    'Mentor: Mevr. A. Smit',
    '',
    'GESPREKSONDERWERPEN',
    '',
    '1. SCHOOLRESULTATEN',
    'Nederlands: Lisa laat wisselende resultaten zien. Laatste',
    'toets: 5.8. Heeft moeite met begrijpend lezen.',
    '',
    'Wiskunde: Stabiele prestaties (gemiddeld 7.2)',
    'Geschiedenis: Uitstekend (8.5 gemiddeld)',
    '',
    '2. GEDRAG EN SOCIALE ONTWIKKELING',
    'Lisa is wat teruggetrokken in de klas. Heeft weinig',
    'vrienden. Ouder geeft aan dat dit thuis ook opvalt.',
    '',
    '3. THUISSITUATIE',
    'Recente scheiding ouders heeft impact op Lisa.',
    'Woont nu afwisselend bij vader (Hoofdstraat 15) en',
    'moeder (Parkweg 8, beide in Voorbeeldstad).',
    '',
    '4. AFSPRAKEN',
    '- Extra begeleiding Nederlands (2x per week)',
    '- Contact schoolmaatschappelijk werk',
    '- Vervolgafspraak over 6 weken',
    '',
    'CONTACTGEGEVENS',
    'Moeder: s.bakker@email.com / 06-98765432',
    'Vader: p.bakker@werk.nl / 06-11223344',
    '',
    'Vertrouwelijke informatie - Schooldossier Lisa Bakker',
    'Studentnummer: 20230089'
  ]

  let yPosition = height - 90
  content.forEach((line, index) => {
    const isHeader = ['AANWEZIG', 'GESPREKSONDERWERPEN', 'CONTACTGEGEVENS'].includes(line) ||
                    line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')
    
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: isHeader ? 11 : 10,
      font: isHeader ? boldFont : font,
      color: rgb(0, 0, 0),
    })
    yPosition -= 15
  })

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('public/samples/education/ouder-gesprek-verslag.pdf', pdfBytes)
  console.log('✅ Parent meeting report created: ouder-gesprek-verslag.pdf')
}

async function createPsychologicalEvaluation() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()

  // Header
  page.drawText('PSYCHOLOGISCHE EVALUATIE', {
    x: 50,
    y: height - 50,
    size: 16,
    font: boldFont,
    color: rgb(0.7, 0, 0), // Red for sensitive document
  })

  page.drawText('VERTROUWELIJK - ALLEEN VOOR SCHOOLMEDEWERKERS', {
    x: 50,
    y: height - 75,
    size: 10,
    font: boldFont,
    color: rgb(0.7, 0, 0),
  })

  const content = [
    'Datum evaluatie: 5 april 2024',
    'Uitgevoerd door: Dr. M. Verhagen, schoolpsycholoog',
    '',
    'LEERLINGGEGEVENS',
    'Naam: Tim de Jong',
    'Geboortedatum: 22 augustus 2007',
    'Studentnummer: 20230156',
    'Klas: 5VWO',
    'Ouders: Dhr. R. de Jong & Mevr. K. de Jong-Visser',
    'Adres: Bloemendaal 33, 5678 CD Voorbeeldstad',
    '',
    'REDEN VERWIJZING',
    'Concentratieproblemen, faalangst bij toetsen,',
    'mogelijk ADHD. Verwijzing door mentor L. van Dijk.',
    '',
    'TESTRESULTATEN',
    'WISC-V IQ test: Totaal IQ 118 (bovengemiddeld)',
    'Werkgeheugen: 95 (gemiddeld)',
    'Verwerkingssnelheid: 87 (beneden gemiddeld)',
    '',
    'ADHD vragenlijst (Conners):',
    'Aandachtsproblemen: Score 78 (klinisch verhoogd)',
    'Hyperactiviteit: Score 45 (normaal)',
    '',
    'CONCLUSIE',
    'Diagnose: ADHD - voornamelijk aandachtstekort type',
    'Advies: Medicatie overleg huisarts, aangepaste toetssituatie',
    '',
    'AANBEVELINGEN',
    '- Rustige toetsruimte',
    '- 25% extra tijd bij examens',
    '- Pauzepogelijkheid tijdens lessen',
    '- Contact ouders voor medicatie-evaluatie',
    '',
    'Handtekening: Dr. M. Verhagen',
    'Registratienummer: 12345-PSY',
    'Contact: m.verhagen@schoolpsychologie.nl'
  ]

  let yPosition = height - 105
  content.forEach((line, index) => {
    const isHeader = ['LEERLINGGEGEVENS', 'REDEN VERWIJZING', 'TESTRESULTATEN', 'CONCLUSIE', 'AANBEVELINGEN'].includes(line)
    
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: isHeader ? 11 : 10,
      font: isHeader ? boldFont : font,
      color: rgb(0, 0, 0),
    })
    yPosition -= 14
  })

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync('public/samples/education/psychologische-evaluatie.pdf', pdfBytes)
  console.log('✅ Psychological evaluation created: psychologische-evaluatie.pdf')
}

createEducationSamples().catch(console.error) 