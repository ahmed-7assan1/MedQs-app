const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType } = require('docx');

async function createStarterTemplates() {
  const templatesDir = path.join(process.cwd(), 'public', 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  // 1. Classic Simple Template
  const doc1 = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: "{#pages}", bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "{#questions}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{n}. {body}", bold: true, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: "{#choiceLines}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{text}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{/choiceLines}" })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "{/questions}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{#answers}", bold: true, color: "0000FF" })] }),
        new Paragraph({ children: [new TextRun({ text: "Answers Key:", bold: true })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Question")] }),
                new TableCell({ children: [new Paragraph("Answer")] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#answers}{q}")] }),
                new TableCell({ children: [new Paragraph("{a}{/answers}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun({ text: "{/answers}" })], pageBreakBefore: true }),
        new Paragraph({ children: [new TextRun({ text: "{/pages}" })] }),
      ],
    }],
  });

  // 2. Modern Boxed Template
  const doc2 = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: "{#pages}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{#questions}" })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.THICK, size: 12, color: "0055A4" },
            bottom: { style: BorderStyle.THICK, size: 12, color: "0055A4" },
            left: { style: BorderStyle.THICK, size: 12, color: "0055A4" },
            right: { style: BorderStyle.THICK, size: 12, color: "0055A4" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "F0F8FF" },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "Question {n}", bold: true, color: "0055A4" })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: "{body}", bold: true })] }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ children: [new TextRun({ text: "{#choiceLines}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{text}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{/choiceLines}" })] }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "{/questions}" })] }),
        new Paragraph({ children: [new TextRun({ text: "Answers for this page:", bold: true })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ shading: { fill: "0055A4" }, children: [new Paragraph({ children: [new TextRun({ text: "Q", color: "FFFFFF", bold: true })] })] }),
                new TableCell({ shading: { fill: "0055A4" }, children: [new Paragraph({ children: [new TextRun({ text: "Ans", color: "FFFFFF", bold: true })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("{#answers}{q}")] }),
                new TableCell({ children: [new Paragraph("{a}{/answers}")] }),
              ],
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun({ text: "{/pages}" })], pageBreakBefore: true }),
      ],
    }],
  });

  // 3. Compact Horizontal Answers Template
  const doc3 = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: "{#pages}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{#questions}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{n}) {body}", bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "{#choiceLines}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{text}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{/choiceLines}" })] }),
        new Paragraph({ children: [new TextRun({ text: "________________________________________________" })] }),
        new Paragraph({ children: [new TextRun({ text: "{/questions}" })] }),
        new Paragraph({ children: [new TextRun({ text: "Answers Key: {#answers} [{q} - {a}]   {/answers}", bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "{/pages}" })], pageBreakBefore: true }),
      ],
    }],
  });

  // 4. Large Font / Visually Impaired
  const doc4 = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: "{#pages}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{#questions}" })] }),
        new Paragraph({ children: [new TextRun({ text: "Question {n}", bold: true, size: 32 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "{body}", size: 28 })] }),
        new Paragraph({ children: [new TextRun({ text: "{#choiceLines}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{text}", size: 28 })] }),
        new Paragraph({ children: [new TextRun({ text: "{/choiceLines}" })] }),
        new Paragraph({ children: [new TextRun({ text: "-----------------------------" })] }),
        new Paragraph({ children: [new TextRun({ text: "{/questions}" })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "{#answers} Q{q} : {a}    {/answers}", size: 24, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "{/pages}" })], pageBreakBefore: true }),
      ],
    }],
  });

  // 5. Clinical Vignette Style
  const doc5 = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: "{#pages}" })] }),
        new Paragraph({ children: [new TextRun({ text: "{#questions}" })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "{n}| {body}", bold: true })] }),
                    new Paragraph({ children: [new TextRun({ text: "{#choiceLines}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{text}" })] }),
                    new Paragraph({ children: [new TextRun({ text: "{/choiceLines}" })] }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: "{/questions}" })] }),
        new Paragraph({ children: [new TextRun({ text: "ANSWERS: {#answers}{q}={a}  {/answers}", bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "{/pages}" })], pageBreakBefore: true }),
      ],
    }],
  });

  const files = [
    { name: "1_Classic_Simple.docx", doc: doc1 },
    { name: "2_Modern_Boxed.docx", doc: doc2 },
    { name: "3_Compact_Horizontal.docx", doc: doc3 },
    { name: "4_Large_Font.docx", doc: doc4 },
    { name: "5_Clinical_Vignette.docx", doc: doc5 },
  ];

  for (const file of files) {
    const buffer = await Packer.toBuffer(file.doc);
    fs.writeFileSync(path.join(templatesDir, file.name), buffer);
    console.log(`Generated ${file.name}`);
  }
}

createStarterTemplates().catch(console.error);
