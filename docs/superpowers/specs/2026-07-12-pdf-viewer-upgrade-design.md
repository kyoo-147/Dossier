# PDF Viewer Upgrade Design

## Overview
To meet the 90% Enterprise Pilot Plan, the current `PdfViewer.tsx` needs an upgrade to support worker rendering, visible/near-page scheduling (virtualization), thumbnail virtualization, a bounded cache, and pan/zoom functionality. We will use a custom Intersection Observer & Canvas Cache approach, keeping `pdfjs-dist`.

## 1. Worker Rendering & PDF Loading
- **Global Worker**: Initialize the `pdfjs` worker once globally to avoid reloading the worker module for every render.
- **Document Caching**: Cache the loaded `pdfjs.PDFDocumentProxy` so we don't re-fetch/parse the PDF when navigating or zooming.

## 2. Virtualization & Near-Page Scheduling
- **Scroll Container**: A container holding placeholders for all pages, with heights calculated based on the aspect ratio of the first page (or page metadata).
- **Intersection Observer**: Attach observers to page placeholders.
  - *Visible*: Render immediately.
  - *Near-Page (Margin)*: Render in the background (e.g., +/- 2 pages).
  - *Out of view*: Cancel rendering and clear canvas to free memory.

## 3. Bounded Canvas Cache
- **LRU Cache**: Limit the number of active rendered canvases (e.g., max 10 pages in memory). When rendering a new page, if the cache exceeds the limit, destroy the oldest off-screen canvas context.

## 4. Pan & Zoom
- Use `react-zoom-pan-pinch` (needs to be installed) as a wrapper around the scroll container.
- It provides smooth wheel zooming, dragging, and pinch-to-zoom out of the box, which is much more reliable than building custom pointer events.
- On zoom, scale the canvas and optionally re-render at a higher resolution (debounced) for crisp text.

## 5. Thumbnail Virtualization
- A separate sidebar component (`PdfThumbnails.tsx`).
- Uses `react-virtuoso` (or similar simple virtualization) to render a list of tiny canvases.
- Shares the `PDFDocumentProxy` but requests a much lower scale factor.

## Proposed Steps
1. Install `react-zoom-pan-pinch`.
2. Refactor `PdfViewer.tsx` to load the PDF document once.
3. Create a `PdfPage.tsx` component that uses IntersectionObserver to trigger its own render.
4. Implement the LRU cache within the parent or via a context.
5. Wrap the pages list in the `TransformWrapper` from `react-zoom-pan-pinch`.
6. Implement the `PdfThumbnails.tsx` sidebar.
