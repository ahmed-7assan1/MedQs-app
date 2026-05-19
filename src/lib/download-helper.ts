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

    // Fallback if readable stream is not supported or Content-Length is 0
    if (total === 0 || !response.body) {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      if (onProgress) onProgress(100);
      return;
    }

    const reader = response.body.getReader();
    let loaded = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (onProgress) {
        onProgress(Math.round((loaded / total) * 100));
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
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Inline download failed, using fallback:", error);
    // Fallback: trigger standard browser download in a hidden iframe to not navigate away
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    // Check if the URL already has search params
    const downloadUrl = url.includes("?") 
      ? `${url}&download=true` 
      : `${url}?download=true`;
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {
        // Silently ignore
      }
    }, 5000);
  }
}
