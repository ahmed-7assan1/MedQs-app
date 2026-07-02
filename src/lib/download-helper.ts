/**
 * Utility to download files inline using fetch + Blob.
 * Prevents leaving the page and allows tracking progress / displaying a spinner.
 */
export async function downloadFileInline(
  url: string,
  filename: string,
  onProgress?: (progress: number) => void
) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body?.getReader();
    let loaded = 0;
    const chunks: BlobPart[] = [];

    if (!reader) {
      const blob = await response.blob();
      chunks.push(new Uint8Array(await blob.arrayBuffer()));
      loaded = blob.size;
    } else {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (onProgress && total > 0) {
          onProgress(Math.round((loaded / total) * 100));
        }
      }
    }

    const blob = new Blob(chunks);
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    }, 5000);
    if (onProgress) onProgress(100);
  } catch (error) {
    console.error("Inline download failed, using window.open fallback:", error);
    window.open(url, "_blank");
  }
}
