import { FileText, Download, FileImage, FileCode } from "lucide-react";

interface LectureFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes("image")) return <FileImage className="h-4 w-4 text-primary" />;
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
  return <FileCode className="h-4 w-4 text-muted-foreground" />;
}

export function FileList({ files }: { files: LectureFile[] }) {
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 hover:bg-muted transition-colors group"
        >
          <div className="flex items-center gap-3">
            <FileIcon mimeType={file.mimeType} />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.mimeType}</p>
            </div>
          </div>
          <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>
      ))}
    </div>
  );
}
