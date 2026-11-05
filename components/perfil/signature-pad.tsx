"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const STROKE_COLOR = "#1f2937";
const STROKE_WIDTH = 2.2;

interface SignaturePadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}

/** Captura de assinatura em canvas (mouse e toque), sem dependencias externas. */
export function SignaturePad({ value, onChange, disabled }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawingRef = React.useRef(false);
  const loadedValueRef = React.useRef<string | null>(null);

  const ctx = React.useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }, []);

  React.useEffect(() => {
    const context = ctx();
    if (!context) return;
    if (loadedValueRef.current === value) return;
    loadedValueRef.current = value;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (value && value.startsWith("data:image/")) {
      const img = new Image();
      img.onload = () => context.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      img.src = value;
    }
  }, [value, ctx]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const context = ctx();
    if (!context) return;
    drawingRef.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    const { x, y } = pointFromEvent(e);
    context.beginPath();
    context.moveTo(x, y);
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = STROKE_COLOR;
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = ctx();
    if (!context) return;
    const { x, y } = pointFromEvent(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    loadedValueRef.current = dataUrl;
    onChange(dataUrl);
  };

  const clear = () => {
    const context = ctx();
    if (!context) return;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    loadedValueRef.current = "";
    onChange("");
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full max-w-md touch-none rounded-md border border-input bg-white"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
        aria-label="Area para desenhar a assinatura"
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={clear} disabled={disabled}>
          <Eraser className="h-4 w-4" />
          Limpar assinatura
        </Button>
        <span className="text-xs text-muted-foreground">
          Desenhe com o mouse ou o dedo (em telas sensiveis ao toque).
        </span>
      </div>
    </div>
  );
}
