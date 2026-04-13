"use export"; // This needs to be a client component
"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, Download, Printer } from "lucide-react";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
import { ExportWordItem, ExportWordSettings, exportQuestionsToWord } from "@/lib/export-word-client";
import { exportQuestionsToPdf } from "@/lib/export-pdf-client";

interface WordExportModalProps {
  questions: ExportWordItem[];
  onClose: () => void;
  title?: string;
  filename?: string;
}

export function WordExportModal({ questions, onClose, title = "Export Settings", filename = "Questions_Export" }: WordExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportFilename, setExportFilename] = useState(filename);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<{id: string, name: string, fileUrl: string}[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [libTemplateName, setLibTemplateName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportWordSettings>({
    questionColor: "#C00000",
    answerColor: "#000000",
    borderColor: "#4472C4",
    bgColor: "#D9E1F2",
    fontFamily: "Candara",
    includeExplanation: false,
    questionBold: true,
    questionUnderline: true,
    answerLayout: "INLINE",
    questionsPerPage: 4,
    answersBold: false, // NEW DEFAULT
    randomizeQuestions: false,
  });

  useEffect(() => {
    fetch("/api/v1/templates")
      .then(res => res.json())
      .then(data => {
        if (data.templates) setSavedTemplates(data.templates);
      })
      .catch(console.error);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    let finalQuestions = [...questions];
    if (exportSettings.randomizeQuestions) {
      for (let i = finalQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
      }
    }
    
    let templateBuffer: ArrayBuffer | undefined;
    
    // Priority 1: Local custom uploaded file
    if (templateFile) {
      // If user wants to save this new file to the library
      if (saveToLibrary && libTemplateName.trim()) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", templateFile);
        formData.append("folder", "template");
        
        try {
          const res = await fetch("/api/v1/upload/direct", { method: "POST", body: formData });
          const uploadData = await res.json();
          if (uploadData.url) {
            await fetch("/api/v1/templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: libTemplateName, fileUrl: uploadData.url })
            });
          }
        } catch (e) {
          console.error("Failed to save template", e);
        }
        setIsUploading(false);
      }
      templateBuffer = await templateFile.arrayBuffer();
    } else if (selectedTemplateId && selectedTemplateId !== "none") {
      // Priority 2: Previously saved template
      const st = savedTemplates.find(t => t.id === selectedTemplateId);
      if (st) {
        try {
          const res = await fetch(st.fileUrl);
          templateBuffer = await res.arrayBuffer();
        } catch(e) {
          console.error("Failed to fetch saved template", e);
        }
      }
    }

    const finalName = exportFilename || filename;
    const success = await exportQuestionsToWord(finalQuestions, exportSettings, finalName.endsWith(".docx") ? finalName : `${finalName}.docx`, templateBuffer);
    setIsExporting(false);
    if (success) onClose();
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    let finalQuestions = [...questions];
    if (exportSettings.randomizeQuestions) {
      for (let i = finalQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
      }
    }
    const finalName = exportFilename || filename;
    const success = await exportQuestionsToPdf(finalQuestions, exportSettings, finalName);
    setIsExportingPdf(false);
    if (success) onClose();
  };

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <FileText className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="text-xs text-muted-foreground">Adjust the visual settings before generating the file.</p>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Export Filename</label>
          <input 
            type="text" 
            value={exportFilename} 
            onChange={(e) => setExportFilename(e.target.value)} 
            className="w-full text-xs h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
            placeholder="Document Name"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Question Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={exportSettings.questionColor} onChange={(e) => setExportSettings({...exportSettings, questionColor: e.target.value})} className="h-8 w-8 cursor-pointer rounded border border-border bg-background p-0" />
            <span className="text-xs font-mono">{exportSettings.questionColor}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Answer Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={exportSettings.answerColor} onChange={(e) => setExportSettings({...exportSettings, answerColor: e.target.value})} className="h-8 w-8 cursor-pointer rounded border border-border bg-background p-0" />
            <span className="text-xs font-mono">{exportSettings.answerColor}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Border Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={exportSettings.borderColor} onChange={(e) => setExportSettings({...exportSettings, borderColor: e.target.value})} className="h-8 w-8 cursor-pointer rounded border border-border bg-background p-0" />
            <span className="text-xs font-mono">{exportSettings.borderColor}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Highlight Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={exportSettings.bgColor} onChange={(e) => setExportSettings({...exportSettings, bgColor: e.target.value})} className="h-8 w-8 cursor-pointer rounded border border-border bg-background p-0" />
            <span className="text-xs font-mono">{exportSettings.bgColor}</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Font Family</label>
          <MedqsSelect
            value={exportSettings.fontFamily}
            onChange={(e) => setExportSettings({...exportSettings, fontFamily: e.target.value})}
            className="w-full text-xs"
          >
            <option value="Candara">Candara</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Calibri">Calibri</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Nizar">Nizar</option>
            <option value="Kufi">Kufi</option>
            <option value="Traditional Arabic">Traditional Arabic</option>
            <option value="Sakkal Majalla">Sakkal Majalla</option>
            <option value="GE SS Two">GE SS Two</option>
          </MedqsSelect>
        </div>
        
        <div className="col-span-full border-t border-border pt-3 mt-1 flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={exportSettings.questionBold} onChange={(e) => setExportSettings({...exportSettings, questionBold: e.target.checked})} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
            Bold Question Text
          </label>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={exportSettings.questionUnderline} onChange={(e) => setExportSettings({...exportSettings, questionUnderline: e.target.checked})} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
            Underline Question Text
          </label>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={exportSettings.answersBold} onChange={(e) => setExportSettings({...exportSettings, answersBold: e.target.checked})} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
            Bold Answers Text
          </label>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={exportSettings.includeExplanation} onChange={(e) => setExportSettings({...exportSettings, includeExplanation: e.target.checked})} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
            Include Explanation
          </label>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-violet-700 dark:text-violet-400">
            <input type="checkbox" checked={exportSettings.randomizeQuestions} onChange={(e) => setExportSettings({...exportSettings, randomizeQuestions: e.target.checked})} className="rounded border-violet-500 text-violet-600 focus:ring-violet-500 h-4 w-4" />
            Randomize Order (Shuffle)
          </label>
        </div>

        <div className="col-span-full grid gap-3 sm:grid-cols-2 bg-muted/20 p-3 rounded-lg border border-border mt-1">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Answers Layout Style</label>
            <MedqsSelect
              value={exportSettings.answerLayout}
              onChange={(e) => setExportSettings({...exportSettings, answerLayout: e.target.value as ExportWordSettings["answerLayout"]})}
              className="w-full text-xs"
            >
              <option value="INLINE">Inline Column (Right)</option>
              <option value="END_OF_PAGE">Answers below every N questions (e.g. per Page)</option>
              <option value="END_OF_DOC">Answers table at the end of the document</option>
            </MedqsSelect>
          </div>
          
          {(exportSettings.answerLayout === "END_OF_PAGE" || templateFile || (selectedTemplateId && selectedTemplateId !== "none")) && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                {templateFile || (selectedTemplateId && selectedTemplateId !== "none") ? "Questions Per Page (for {#pages})" : "Questions Per Page"}
              </label>
              <input 
                type="number" 
                min={1} 
                max={50} 
                value={exportSettings.questionsPerPage} 
                onChange={(e) => setExportSettings({...exportSettings, questionsPerPage: Number(e.target.value) || 4})}
                className="w-full text-xs h-9 rounded-md border border-input bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 bg-muted/20 p-3 rounded-lg border border-border mt-1">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">My Saved Templates (Library)</label>
          <MedqsSelect
            value={selectedTemplateId}
            onChange={(e) => {
              setSelectedTemplateId(e.target.value);
              if (e.target.value !== "none") setTemplateFile(null); // Clear manual upload if selecting from library
            }}
            className="w-full text-xs"
          >
            <option value="none">-- None (Use standard layout) --</option>
            {savedTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </MedqsSelect>
          <div className="mt-2 text-[10px] text-muted-foreground leading-tight space-y-1">
            <p>Or download a pre-built starter template to learn:</p>
            <div className="flex flex-wrap gap-2">
              <a href="/templates/1_Classic_Simple.docx" target="_blank" className="text-primary hover:underline">Classic</a>
              <a href="/templates/2_Modern_Boxed.docx" target="_blank" className="text-primary hover:underline">Modern</a>
              <a href="/templates/3_Compact_Horizontal.docx" target="_blank" className="text-primary hover:underline">Compact</a>
              <a href="/templates/4_Large_Font.docx" target="_blank" className="text-primary hover:underline">Large Font</a>
              <a href="/templates/5_Clinical_Vignette.docx" target="_blank" className="text-primary hover:underline">Clinical</a>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Upload Custom Template (Word Only)</label>
          <div className="flex items-center gap-2">
            <label className="flex h-9 w-full cursor-pointer items-center justify-center rounded border border-dashed border-primary/50 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors px-3">
              {templateFile ? <span className="truncate max-w-[200px]">{templateFile.name}</span> : <span>Upload .docx Template</span>}
              <input type="file" accept=".docx" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setTemplateFile(f);
                  setSelectedTemplateId("none"); // Deselect library if manual upload
                }
              }} />
            </label>
            {templateFile && (
              <button 
                type="button" 
                onClick={() => setTemplateFile(null)}
                className="h-9 px-2 flex items-center justify-center rounded border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>
          
          {templateFile && (
            <div className="mt-2 space-y-2 rounded border border-border p-2 bg-background">
              <label className="flex items-center gap-2 text-[11px] font-medium cursor-pointer text-primary">
                <input type="checkbox" checked={saveToLibrary} onChange={(e) => setSaveToLibrary(e.target.checked)} className="rounded border-primary text-primary focus:ring-primary h-3.5 w-3.5" />
                Save this template to Library
              </label>
              {saveToLibrary && (
                <input 
                  type="text" 
                  value={libTemplateName} 
                  onChange={(e) => setLibTemplateName(e.target.value)} 
                  placeholder="Template Name (e.g. Endocrine Final)"
                  className="w-full text-xs h-7 rounded border border-input bg-transparent px-2 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
          Close
        </button>
        <button type="button" disabled={isExporting || isExportingPdf || isUploading || questions.length === 0} onClick={handleExport} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-2">
          {isExporting || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Word (.docx)
        </button>
        <button type="button" disabled={isExporting || isExportingPdf || questions.length === 0} onClick={handleExportPdf} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60 transition-colors flex items-center gap-2">
          {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          PDF (Print)
        </button>
      </div>
    </div>
  );
}
