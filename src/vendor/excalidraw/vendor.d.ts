declare module "@/vendor/excalidraw/vendor" {
  import React from "react";

  interface ExcalidrawProps {
    excalidrawAPI?: (api: any) => void;
    initialData?: any;
    onChange?: (elements: any[], appState: any) => void;
    theme?: string;
    viewModeEnabled?: boolean;
    zenModeEnabled?: boolean;
    gridModeEnabled?: boolean;
    UIOptions?: { canvasActions?: { toggleTheme?: boolean } };
    name?: string;
  }

  export const Excalidraw: React.FC<ExcalidrawProps>;

  export function exportToBlob(opts: any): Promise<any>;
  export function exportToSvg(opts: any): Promise<any>;
  export function loadLibraryFromBlob(blob: Blob): Promise<any>;
}
