import { useEffect, useRef } from "react";

export interface EvidenceRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone?: "accent" | "warning" | "success";
}

interface EvidenceCanvasOverlayProps {
  regions: EvidenceRegion[];
  selectedRegionId?: string | null;
  onSelectRegion?: (regionId: string) => void;
}

const toneColors = {
  accent: { stroke: "rgba(68, 108, 218, 0.72)", fill: "rgba(68, 108, 218, 0.08)" },
  warning: { stroke: "rgba(211, 154, 38, 0.78)", fill: "rgba(211, 154, 38, 0.10)" },
  success: { stroke: "rgba(32, 147, 103, 0.72)", fill: "rgba(32, 147, 103, 0.08)" }
};

export function EvidenceCanvasOverlay({ regions, selectedRegionId, onSelectRegion }: EvidenceCanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (navigator.userAgent.toLowerCase().includes("jsdom")) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
      let context: CanvasRenderingContext2D | null = null;
      try {
        context = canvas.getContext("2d");
      } catch {
        return;
      }
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.scale(scale, scale);
      context.lineWidth = 1.5;
      context.font = "10px Segoe UI, Arial, sans-serif";

      for (const region of regions) {
        const colors = toneColors[region.tone ?? "accent"];
        const x = region.x * rect.width;
        const y = region.y * rect.height;
        const w = region.w * rect.width;
        const h = region.h * rect.height;
        const selected = region.id === selectedRegionId;

        context.fillStyle = colors.fill;
        context.strokeStyle = colors.stroke;
        context.lineWidth = selected ? 2.5 : 1.3;
        context.fillRect(x, y, w, h);
        context.strokeRect(x, y, w, h);
        if (selected) {
          context.fillStyle = colors.stroke;
          context.fillRect(x, Math.max(0, y - 18), Math.min(w, 150), 18);
          context.fillStyle = "#fff";
          context.fillText(region.label.slice(0, 24), x + 6, Math.max(12, y - 5));
        }
      }
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [regions, selectedRegionId]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="evidence-canvas"
        aria-label="Evidence region overlay"
        role="img"
        onClick={(event) => {
          if (!onSelectRegion) return;
          const canvas = event.currentTarget;
          const rect = canvas.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          for (let index = regions.length - 1; index >= 0; index -= 1) {
            const region = regions[index];
            if (!region) continue;
            if (px >= region.x && px <= region.x + region.w && py >= region.y && py <= region.y + region.h) {
              onSelectRegion(region.id);
              break;
            }
          }
        }}
      />
      {onSelectRegion ? (
        <div className="evidence-region-actions" aria-label="Evidence regions">
          {regions.map((region) => (
            <button key={region.id} type="button" onClick={() => onSelectRegion(region.id)}>
              Select evidence region: {region.label}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
