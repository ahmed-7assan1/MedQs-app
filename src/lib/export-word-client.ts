import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, ShadingType, AlignmentType, VerticalAlign, UnderlineType, PageBreak } from "docx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import PizZip from "pizzip";
// @ts-ignore
import Docxtemplater from "docxtemplater";

export interface ExportWordItem {
  body: string;
  choices: { key: string; text: string }[];
  answer: string;
  explanation?: string | null;
}

export interface ExportWordSettings {
  questionColor: string;
  answerColor: string;
  borderColor: string;
  bgColor: string;
  fontFamily: string;
  includeExplanation: boolean;
  questionBold: boolean;
  questionUnderline: boolean;
  answerLayout: "INLINE" | "END_OF_PAGE" | "END_OF_DOC";
  questionsPerPage: number;
  answersBold: boolean;
  randomizeQuestions: boolean;
}

export async function exportQuestionsToWord(questions: ExportWordItem[], settings: ExportWordSettings, filename = "Questions_Export.docx", templateBuffer?: ArrayBuffer) {
  try {
    const qColor = settings.questionColor.replace('#', '');
    const aColor = settings.answerColor.replace('#', '');
    const bColor = settings.borderColor.replace('#', '');
    const cbg = settings.bgColor.replace('#', '');
    const fFam = settings.fontFamily;
    
    const doBold = settings.questionBold;
    const doUnderline = settings.questionUnderline;
    const doExpl = settings.includeExplanation;
    const layout = settings.answerLayout;
    const perPage = Number(settings.questionsPerPage) || 4;
    const ansBold = settings.answersBold;

    const childrenBlocks: any[] = [];

    const renderTable = (qList: ExportWordItem[], startIndex: number, hideAnswers: boolean) => {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          left: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          right: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          insideVertical: { style: BorderStyle.SINGLE, size: 8, color: bColor },
        },
        rows: qList.map((q, localIndex) => {
          const index = startIndex + localIndex;
          const questionContent = [
            new Paragraph({
              children: [
                new TextRun({
                  text: q.body || " ",
                  font: fFam,
                  bold: doBold,
                  underline: doUnderline ? { type: UnderlineType.SINGLE, color: qColor } : undefined,
                  color: qColor,
                  size: 24,
                }),
              ],
              spacing: { after: 60, before: 60 },
            }),
            ...q.choices.map((c) => new Paragraph({
              children: [
                new TextRun({
                  text: `${c.key}) ${c.text}`,
                  font: fFam,
                  color: aColor,
                  bold: ansBold,
                  size: 22,
                }),
              ],
              spacing: { before: 20, after: 20 },
            })),
            (doExpl && q.explanation) ? new Paragraph({
              children: [
                new TextRun({
                  text: `\nExplanation: ${q.explanation}`,
                  font: fFam,
                  color: "555555",
                  size: 20,
                  italics: true,
                })
              ],
              spacing: { before: 60, after: 60 },
            }) : null
          ].filter(Boolean) as Paragraph[];

          const cells = [
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              shading: { fill: cbg, type: ShadingType.CLEAR, color: "auto" },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${index + 1}`,
                      font: fFam,
                      bold: true,
                      size: 24,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              width: { size: hideAnswers ? 90 : 80, type: WidthType.PERCENTAGE },
              shading: { fill: "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: questionContent,
            }),
          ];

          if (!hideAnswers) {
            cells.push(
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                shading: { fill: cbg, type: ShadingType.CLEAR, color: "auto" },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: q.answer || "",
                        font: fFam,
                        bold: true,
                        size: 28,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              })
            );
          }

          return new TableRow({
            cantSplit: true,
            children: cells,
          });
        }),
      });
    };

    const renderAnswerTable = (qList: ExportWordItem[], startIndex: number) => {
      const columnsPerPair = 2; // [Q_Num, Answer]
      const maxPairsPerRow = 5; 
      const rowCellsSize = 10; // 10% each (10 columns total)
      
      const rowsToRender = [];
      for (let i = 0; i < qList.length; i += maxPairsPerRow) {
        const chunk = qList.slice(i, i + maxPairsPerRow);
        const cells = [];
        
        for (let j = 0; j < chunk.length; j++) {
           const q = chunk[j];
           cells.push(
             new TableCell({
               width: { size: rowCellsSize, type: WidthType.PERCENTAGE },
               shading: { fill: cbg, type: ShadingType.CLEAR, color: "auto" },
               verticalAlign: VerticalAlign.CENTER,
               children: [
                 new Paragraph({
                   children: [new TextRun({ text: `Q${startIndex + i + j + 1}`, font: fFam, bold: true, size: 24 })],
                   alignment: AlignmentType.CENTER,
                 })
               ]
             })
           );
           cells.push(
             new TableCell({
               width: { size: rowCellsSize, type: WidthType.PERCENTAGE },
               shading: { fill: "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
               verticalAlign: VerticalAlign.CENTER,
               children: [
                  new Paragraph({
                    children: [new TextRun({ text: q.answer || "", font: fFam, bold: true, size: 24 })],
                    alignment: AlignmentType.CENTER,
                  })
               ]
             })
           );
        }
        
        // Pad row with empty cells if we didn't fill it
        const emptyCellsNeeded = (maxPairsPerRow - chunk.length) * columnsPerPair;
        for (let k = 0; k < emptyCellsNeeded; k++) {
           cells.push(new TableCell({ 
             width: { size: rowCellsSize, type: WidthType.PERCENTAGE },
             children: [new Paragraph({ text: "" })] 
           }));
        }

        rowsToRender.push(new TableRow({ cantSplit: true, children: cells }));
      }

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          left: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          right: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: bColor },
          insideVertical: { style: BorderStyle.SINGLE, size: 8, color: bColor },
        },
        rows: rowsToRender
      });
    };

    if (layout === "INLINE") {
      childrenBlocks.push(renderTable(questions, 0, false));
    } else if (layout === "END_OF_DOC") {
      childrenBlocks.push(renderTable(questions, 0, true));
      childrenBlocks.push(new Paragraph({ text: "", spacing: { before: 800, after: 800 } }));
      childrenBlocks.push(new Paragraph({ children: [new TextRun({ text: "Answers Key", font: fFam, bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }));
      childrenBlocks.push(renderAnswerTable(questions, 0));
    } else if (layout === "END_OF_PAGE") {
       for (let i = 0; i < questions.length; i += perPage) {
          const chunk = questions.slice(i, i + perPage);
          childrenBlocks.push(renderTable(chunk, i, true));
          childrenBlocks.push(new Paragraph({ text: "", spacing: { before: 400, after: 400 } }));
          childrenBlocks.push(renderAnswerTable(chunk, i));
          
          if (i + perPage < questions.length) {
            childrenBlocks.push(new Paragraph({ children: [new PageBreak()] }));
          }
       }
    }

    let blob: Blob;
    if (templateBuffer) {
      const zip = new PizZip(templateBuffer);
      const docTpl = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // We will create a flexible schema so the user can use global {#questions} OR pagination {#pages}
      const qPerPage = settings.questionsPerPage || 4;
      const pagesData: any[] = [];
      const globalQuestions: any[] = [];
      const globalAnswers: any[] = [];

      for (let i = 0; i < questions.length; i += qPerPage) {
        const chunk = questions.slice(i, i + qPerPage);
        
        const chunkQuestions = chunk.map((q, localIdx) => {
          const absoluteIdx = i + localIdx;
          const maxLen = q.choices.length > 0 ? Math.max(...q.choices.map(c => c.text.length)) : 0;
          
          let choiceLines: { text: string }[] = [];

          if (q.choices.length === 0) {
            // Essay question formatting: inject dotted lines for the student to write their answer
            choiceLines = [
              { text: "" },
              { text: "................................................................................................................" },
              { text: "................................................................................................................" },
              { text: "................................................................................................................" }
            ];
          } else if (maxLen <= 40 && q.choices.length > 0) {
            let maxLeftColLen = 0;
            for (let j = 0; j < q.choices.length; j += 2) {
               const len = q.choices[j].text.length + 3;
               if (len > maxLeftColLen) maxLeftColLen = len;
            }
            const charsPerTab = 7;
            const targetTabStop = Math.ceil((maxLeftColLen + 2) / charsPerTab) + 1;

            for (let j = 0; j < q.choices.length; j += 2) {
              const c1 = q.choices[j];
              const c2 = q.choices[j + 1];
              
              if (!c2) {
                 choiceLines.push({ text: `${c1.key}) ${c1.text}` });
                 continue;
              }

              const c1Str = `${c1.key}) ${c1.text}`;
              const consumedTabs = Math.floor(c1Str.length / charsPerTab);
              const neededTabs = Math.max(1, targetTabStop - consumedTabs);
              const tabs = "\t".repeat(neededTabs);
              
              choiceLines.push({ text: `${c1Str}${tabs}${c2.key}) ${c2.text}` });
            }
          } else {
             choiceLines = q.choices.map(c => ({ text: `${c.key}) ${c.text}` }));
          }

          const qFormatted = {
            n: absoluteIdx + 1,
            num: absoluteIdx + 1,
            body: q.body,
            choices: choiceLines.map(cl => cl.text).join('\n'), // fallback for users still using {choices}
            choiceLines: choiceLines, // ADVANCED: array of strings to enforce true Word paragraphs
            answer: q.answer,
            explanation: q.explanation || ""
          };
          globalQuestions.push(qFormatted);
          return qFormatted;
        });

        const chunkAnswers = chunk.map((q, localIdx) => {
          const ans = { q: i + localIdx + 1, a: q.answer };
          globalAnswers.push(ans);
          return ans;
        });

        pagesData.push({
          questions: chunkQuestions,
          answers: chunkAnswers
        });
      }

      docTpl.render({ 
        pages: pagesData, 
        questions: globalQuestions, 
        answers: globalAnswers,
        all_answers: globalAnswers 
      });

      blob = docTpl.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
    } else {
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, bottom: 1440, left: 720, right: 720 },
              }
            },
            children: childrenBlocks,
          },
        ],
      });
      blob = await Packer.toBlob(doc);
    }
    saveAs(blob, filename);
    toast.success("Word document generated");
    return true;
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to generate Word document");
    return false;
  }
}
