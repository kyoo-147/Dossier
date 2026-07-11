import { useEffect, useRef, useState } from "react";

interface PdfViewerProps {
  url: string;
  pageNumber?: number;
  scale?: number;
}

export function PdfViewer({ url, pageNumber = 1, scale = 1.0 }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let renderTask: any = null;
    let isMounted = true;

    const renderPage = async () => {
      try {
        if (typeof DOMMatrix === "undefined") {
          return;
        }

        const [pdfjsLib, workerModule] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.mjs?url")
        ]);
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;

        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;

        const safePageNum = Math.min(Math.max(1, pageNumber), pdf.numPages);
        const page = await pdf.getPage(safePageNum);
        
        if (!isMounted) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // @ts-ignore
        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (isMounted && err.name !== "RenderingCancelledException") {
          setError(err.message || "Failed to render PDF");
          console.error(err);
        }
      }
    };

    void renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [url, pageNumber, scale]);

  if (error) {
    return <div className="pdf-error">Failed to load PDF: {error}</div>;
  }

  return (
    <div className="pdf-viewer-container" style={{ overflow: "auto", height: "100%", width: "100%", display: "flex", justifyContent: "center" }}>
      <canvas ref={canvasRef} style={{ border: "1px solid #ddd", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
    </div>
  );
}
