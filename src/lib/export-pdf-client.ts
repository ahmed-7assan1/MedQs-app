import { ExportWordItem, ExportWordSettings } from "./export-word-client";
import { marked } from "marked";
// @ts-ignore
import html2pdf from "html2pdf.js";

/**
 * Creates an invisible iframe, populates it with HTML/CSS representing the
 * exact layout of the questions, and triggers window.print()
 */
export async function exportQuestionsToPdf(questions: ExportWordItem[], settings: ExportWordSettings, title: string = "Quiz Export") {
  return new Promise<boolean>((resolve) => {
    try {
      const htmlContent = generatePdfHtml(questions, settings, title);

      // Create a temporary container
      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      // We must append to body for html2pdf to correctly gauge computed styles
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      document.body.appendChild(container);

      const opt = {
        margin:       10,
        filename:     title.endsWith('.pdf') ? title : `${title}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(container).save().then(() => {
        document.body.removeChild(container);
        resolve(true);
      }).catch((err: any) => {
        console.error("PDF generation failed:", err);
        document.body.removeChild(container);
        resolve(false);
      });

    } catch (err) {
      console.error("PDF setup failed:", err);
      resolve(false);
    }
  });
}

function generatePdfHtml(questions: ExportWordItem[], settings: ExportWordSettings, title: string): string {
  // Translate settings into CSS constants
  const pFont = settings.fontFamily || "Candara";
  const pQColor = settings.questionColor || "#C00000";
  const pAColor = settings.answerColor || "#000000";
  const pBorderColor = settings.borderColor || "#4472C4";
  const pBgColor = settings.bgColor || "#D9E1F2";

  // Shared markdown parser to avoid dangerouslySetInnerHTML in react, here we securely use it in iframe
  const mdToHtml = (md: string) => marked.parseInline(md || "") as string;
  const mdToHtmlBlock = (md: string) => marked.parse(md || "") as string;

  // Build the questions sections
  let questionsHtml = "";
  let endTableHtml = "";
  let pagedAnswersCache: { i: number; q: ExportWordItem }[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qNum = i + 1;

    const qBodyStyle = `
      color: ${pQColor}; 
      font-weight: ${settings.questionBold ? 'bold' : 'normal'};
      text-decoration: ${settings.questionUnderline ? 'underline' : 'none'};
      font-size: 16pt;
      margin-bottom: 15px;
    `;

    // Exact Table Layout as Word
    // Cell 1: 10% width, bgc
    // Cell 2: 80-90% width
    // Cell 3 (if inline): 10% width, bgc

    let thirdCellHtml = "";
    let choicesHtml = "";
    let questionCellWidth = settings.answerLayout === "INLINE" ? "80%" : "90%";
    
    if (settings.answerLayout === "INLINE") {
      thirdCellHtml = `
        <td style="width: 10%; background-color: ${pBgColor}; text-align: center; vertical-align: middle; border-left: 2px solid ${pBorderColor};">
           <div style="font-size: 20pt; font-weight: bold; color: ${pAColor};">${q.answer}</div>
        </td>
      `;
    } else {
      const choicesList = q.choices.map(c => `<div style="margin-bottom: 8px;"><b>${c.key})</b> ${mdToHtml(c.text)}</div>`).join("");
      choicesHtml = `<div style="font-size: 15pt; color: ${pAColor}; font-weight: ${settings.answersBold ? 'bold' : 'normal'};">${choicesList}</div>`;
      if (settings.includeExplanation && q.explanation) {
        choicesHtml += `<div style="margin-top: 15px; color: #555; font-style: italic; font-size: 13pt;">Explanation: ${mdToHtmlBlock(q.explanation)}</div>`;
      }
      
      if (settings.answerLayout === "END_OF_PAGE" || settings.answerLayout === "END_OF_DOC") {
        pagedAnswersCache.push({ i: qNum, q });
      }
    }

    if (settings.answerLayout === "INLINE") {
       const choicesList = q.choices.map(c => `<div style="margin-bottom: 8px;"><b>${c.key})</b> ${mdToHtml(c.text)}</div>`).join("");
       choicesHtml = `<div style="font-size: 15pt; color: ${pAColor}; font-weight: ${settings.answersBold ? 'bold' : 'normal'};">${choicesList}</div>`;
       if (settings.includeExplanation && q.explanation) {
         choicesHtml += `<div style="margin-top: 15px; color: #555; font-style: italic; font-size: 13pt;">Explanation: ${mdToHtmlBlock(q.explanation)}</div>`;
       }
    }

    questionsHtml += `
      <table class="q-table" style="width: 100%; border: 2px solid ${pBorderColor}; border-collapse: collapse; margin-bottom: 25px; page-break-inside: avoid;">
        <tr>
          <td style="width: 10%; background-color: ${pBgColor}; text-align: center; vertical-align: middle; border-right: 2px solid ${pBorderColor};">
            <div style="font-size: 18pt; font-weight: bold;">${qNum}</div>
          </td>
          <td style="width: ${questionCellWidth}; padding: 20px; vertical-align: top;">
            <div style="${qBodyStyle}">${mdToHtml(q.body)}</div>
            ${choicesHtml}
          </td>
          ${thirdCellHtml}
        </tr>
      </table>
    `;

    // Process END_OF_PAGE layout flush
    if (settings.answerLayout === "END_OF_PAGE" && (qNum % settings.questionsPerPage === 0 || i === questions.length - 1)) {
      if (pagedAnswersCache.length > 0) {
        questionsHtml += buildAnswersTable(pagedAnswersCache, settings);
        pagedAnswersCache = [];
      }
    }
  }

  // End of document layout flush
  if (settings.answerLayout === "END_OF_DOC" && pagedAnswersCache.length > 0) {
    endTableHtml = `
      <div class="page-break"></div>
      <h2>Answers Key</h2>
      ${buildAnswersTable(pagedAnswersCache, settings)}
    `;
  }

  const output = `
    <div class="pdf-container" style="direction: rtl; font-family: '${pFont}', sans-serif; padding: 20px; font-size: 14pt; background: white;">
      ${questionsHtml}
      ${endTableHtml}
    </div>
  `;

  return output;
}

function buildAnswersTable(items: { i: number; q: ExportWordItem }[], settings: ExportWordSettings): string {
  // Create a 5-column horizontal answers layout exactly like the Word exporter does
  const PAIRS_PER_ROW = 5;
  let rowsHtml = "";

  for (let r = 0; r < items.length; r += PAIRS_PER_ROW) {
    const chunk = items.slice(r, r + PAIRS_PER_ROW);
    
    let tds = "";
    for (const item of chunk) {
      tds += `<th>Q ${item.i}</th><td>${item.q.answer}</td>`;
    }
    // Pad empty cells if chunk is less than 5
    for (let c = chunk.length; c < PAIRS_PER_ROW; c++) {
      tds += `<th>-</th><td>-</td>`;
    }

    rowsHtml += `<tr>${tds}</tr>`;
  }

  // Explanations appended below table
  let explanationsHtml = "";
  if (settings.includeExplanation) {
    const withExpl = items.filter(x => x.q.explanation);
    if (withExpl.length > 0) {
      explanationsHtml += `<div style="page-break-inside:avoid; margin-top:1rem;"><h3>Explanations</h3><ul>`;
      for (const item of withExpl) {
        explanationsHtml += `<li><b>Q ${item.i}:</b> ${marked.parseInline(item.q.explanation || "")}</li>`;
      }
      explanationsHtml += `</ul></div>`;
    }
  }

  return `
    <table class="answers-table">
      ${rowsHtml}
    </table>
    ${explanationsHtml}
  `;
}
