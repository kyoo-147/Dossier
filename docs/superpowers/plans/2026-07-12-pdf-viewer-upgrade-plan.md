# PDF Viewer Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Dossier PDF Viewer to support worker rendering, near-page scheduling, thumbnail virtualization, bounded cache, and pan/zoom for the Enterprise Pilot.

**Architecture:** Custom IntersectionObserver with LRU canvas cache, using `react-zoom-pan-pinch` for panning/zooming and `react-virtuoso` for the thumbnail sidebar.

**Tech Stack:** React, TypeScript, pdfjs-dist, react-zoom-pan-pinch, react-virtuoso

## Global Constraints

- Must work in offline/local-first mode without external HTTP requests.
- Ensure pdf.worker.mjs is loaded locally.
- 10-page LRU bounded cache max for active canvases to preserve memory.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `apps/desktop/package.json`

**Interfaces:**
- Consumes: N/A
- Produces: N/A

- [ ] **Step 1: Install react-zoom-pan-pinch and react-virtuoso**

Run: `pnpm --filter @dossier/desktop add react-zoom-pan-pinch react-virtuoso`
Expected: Packages added to `apps/desktop/package.json`

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/package.json pnpm-lock.yaml
git commit -m "build: add react-zoom-pan-pinch and react-virtuoso for pdf viewer"
```

---

### Task 2: Create PdfDocumentContext and Global Worker

**Files:**
- Create: `apps/desktop/src/features/review/components/PdfDocumentContext.tsx`
- Modify: `apps/desktop/src/features/review/components/PdfViewer.tsx`

**Interfaces:**
- Consumes: pdfjs-dist
- Produces: `usePdfDocument()` hook returning `{ pdf: PDFDocumentProxy | null, error: string | null }`

- [ ] **Step 1: Write `PdfDocumentContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Initialize worker globally once
let workerInitialized = false;

export const PdfDocumentContext = createContext<{ pdf: PDFDocumentProxy | null; error: string | null } | null>(null);

export function usePdfDocument() {
  const context = useContext(PdfDocumentContext);
  if (!context) throw new Error("usePdfDocument must be used within PdfDocumentProvider");
  return context;
}

export function PdfDocumentProvider({ url, children }: { url: string; children: ReactNode }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        if (!workerInitialized) {
          const workerModule = await import("pdfjs-dist/build/pdf.worker.mjs?url");
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
          workerInitialized = true;
        }

        const loadingTask = pdfjsLib.getDocument({ url });
        const loadedPdf = await loadingTask.promise;
        if (isMounted) setPdf(loadedPdf);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load PDF");
      }
    };
    void init();
    return () => {
      isMounted = false;
      pdf?.destroy();
    };
  }, [url]);

  return (
    <PdfDocumentContext.Provider value={{ pdf, error }}>
      {children}
    </PdfDocumentContext.Provider>
  );
}
```

- [ ] **Step 2: Refactor `PdfViewer.tsx` to use Provider (temporary wrapper)**

```tsx
import { PdfDocumentProvider, usePdfDocument } from "./PdfDocumentContext";

function PdfViewerContent() {
  const { pdf, error } = usePdfDocument();
  if (error) return <div className="pdf-error">Failed to load PDF: {error}</div>;
  if (!pdf) return <div>Loading PDF...</div>;
  return <div>PDF Loaded: {pdf.numPages} pages</div>;
}

export function PdfViewer({ url }: { url: string; pageNumber?: number; scale?: number }) {
  return (
    <PdfDocumentProvider url={url}>
      <PdfViewerContent />
    </PdfDocumentProvider>
  );
}
```

- [ ] **Step 3: Run Typescript Check**

Run: `pnpm check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/features/review/components/PdfDocumentContext.tsx apps/desktop/src/features/review/components/PdfViewer.tsx
git commit -m "feat: implement global pdf worker and document context"
```

---

### Task 3: Implement IntersectionObserver PdfPage

**Files:**
- Create: `apps/desktop/src/features/review/components/PdfPage.tsx`

**Interfaces:**
- Consumes: `usePdfDocument`
- Produces: `PdfPage` component

- [ ] **Step 1: Write `PdfPage.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { usePdfDocument } from "./PdfDocumentContext";

export function PdfPage({ pageNumber, scale = 1.0 }: { pageNumber: number; scale?: number }) {
  const { pdf } = usePdfDocument();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "1000px 0px" } // Render 1000px ahead/behind
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !isVisible || !canvasRef.current) return;
    let renderTask: any = null;
    let isMounted = true;

    const render = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (!isMounted) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") console.error(err);
      }
    };
    
    void render();

    return () => {
      isMounted = false;
      if (renderTask) renderTask.cancel();
      // Clear canvas context to free memory when out of view
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    };
  }, [pdf, isVisible, pageNumber, scale]);

  // Use a default aspect ratio placeholder
  return (
    <div ref={containerRef} style={{ width: "100%", minHeight: 800, marginBottom: "20px", display: "flex", justifyContent: "center" }}>
      {isVisible ? (
         <canvas ref={canvasRef} style={{ border: "1px solid #ddd", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", background: "white" }} />
      ) : (
         <div style={{ background: "#f0f0f0", width: `${scale * 600}px`, height: `${scale * 800}px` }} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run Typescript Check**

Run: `pnpm check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/features/review/components/PdfPage.tsx
git commit -m "feat: implement IntersectionObserver-based virtualized PdfPage"
```

---

### Task 4: Integrate Pan/Zoom and Scrolling

**Files:**
- Modify: `apps/desktop/src/features/review/components/PdfViewer.tsx`

**Interfaces:**
- Consumes: `PdfPage`, `TransformWrapper` from `react-zoom-pan-pinch`

- [ ] **Step 1: Update `PdfViewer.tsx` with panning/zooming**

```tsx
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PdfDocumentProvider, usePdfDocument } from "./PdfDocumentContext";
import { PdfPage } from "./PdfPage";

function PdfViewerContent() {
  const { pdf, error } = usePdfDocument();
  
  if (error) return <div className="pdf-error">Failed to load PDF: {error}</div>;
  if (!pdf) return <div style={{ padding: 20 }}>Loading PDF...</div>;

  const numPages = pdf.numPages;

  return (
    <div className="pdf-viewer-container" style={{ width: "100%", height: "100%", overflow: "hidden", background: "#e5e7eb" }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.1 }}
        centerOnInit={true}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
          <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {Array.from({ length: numPages }, (_, i) => (
              <PdfPage key={i + 1} pageNumber={i + 1} scale={1.5} />
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

export function PdfViewer({ url }: { url: string; pageNumber?: number; scale?: number }) {
  return (
    <PdfDocumentProvider url={url}>
      <PdfViewerContent />
    </PdfDocumentProvider>
  );
}
```

- [ ] **Step 2: Run Typescript Check**

Run: `pnpm check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/features/review/components/PdfViewer.tsx
git commit -m "feat: integrate pan/zoom into PdfViewer using react-zoom-pan-pinch"
```

---

### Task 5: Implement Thumbnail Virtualization

**Files:**
- Create: `apps/desktop/src/features/review/components/PdfThumbnails.tsx`

**Interfaces:**
- Consumes: `react-virtuoso`, `usePdfDocument`

- [ ] **Step 1: Write `PdfThumbnails.tsx`**

```tsx
import { Virtuoso } from "react-virtuoso";
import { usePdfDocument } from "./PdfDocumentContext";
import { PdfPage } from "./PdfPage";

export function PdfThumbnails({ onPageSelect }: { onPageSelect?: (page: number) => void }) {
  const { pdf } = usePdfDocument();
  if (!pdf) return null;

  return (
    <div style={{ width: 200, height: "100%", borderRight: "1px solid #ddd", background: "#f9fafb" }}>
      <Virtuoso
        totalCount={pdf.numPages}
        itemContent={(index) => (
          <div 
            style={{ padding: 10, cursor: "pointer" }} 
            onClick={() => onPageSelect?.(index + 1)}
          >
            <div style={{ fontSize: "12px", textAlign: "center", marginBottom: 4 }}>Page {index + 1}</div>
            <PdfPage pageNumber={index + 1} scale={0.2} />
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run Typescript Check**

Run: `pnpm check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/features/review/components/PdfThumbnails.tsx
git commit -m "feat: implement virtualized pdf thumbnails sidebar"
```
