import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Upload,
  Download,
  Clipboard,
  RotateCcw,
  Image,
  Sun,
  Moon,
} from "lucide-react";

function useTheme() {
  const [dark, setDark] = useState(() => {
    const hasClass = document.documentElement.classList.contains("dark");
    if (!hasClass) document.documentElement.classList.add("dark");
    return true;
  });
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };
  return { dark, toggle };
}

interface ShadowSettings {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

interface StyleSettings {
  bgType: "solid" | "gradient" | "transparent";
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  bgWidth: number;
  bgHeight: number;
  borderRadius: number;
  imageBorderRadius: number;
  shadow: ShadowSettings;
  padding: number;
}

const DEFAULT_SETTINGS: StyleSettings = {
  bgType: "solid",
  bgColor: "#ffffff",
  gradientFrom: "#49c5b6",
  gradientTo: "#2779a7",
  bgWidth: 1920,
  bgHeight: 1080,
  borderRadius: 16,
  imageBorderRadius: 0,
  shadow: { x: 0, y: 8, blur: 32, spread: 0, color: "#000000", opacity: 20 },
  padding: 32,
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<StyleSettings>(DEFAULT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render preview — reactive, batched per frame
  const renderVersion = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!image) return;
    const version = ++renderVersion.current;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(async () => {
      const c = document.createElement("canvas");
      await renderToCanvas(c, 0.5);
      if (version !== renderVersion.current) return;
      setPreviewUrl(c.toDataURL("image/png"));
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [image, settings]);

  // Render styled image to canvas
  const renderToCanvas = useCallback(
    (canvas: HTMLCanvasElement, scale = 1) => {
      return new Promise<void>((resolve) => {
        if (!image) { resolve(); return; }
        const img = new window.Image();
        img.onerror = () => resolve();
        img.onload = () => {
          const sw = settings.shadow;
          const pad = settings.padding * scale;
          const bw = settings.bgWidth * scale;
          const bh = settings.bgHeight * scale;
          const availW = bw - pad * 2;
          const availH = bh - pad * 2;
          const fitScale = Math.min(availW / img.width, availH / img.height);
          const dispW = img.width * fitScale;
          const dispH = img.height * fitScale;
          const ox = pad + (availW - dispW) / 2;
          const oy = pad + (availH - dispH) / 2;
          const r = settings.borderRadius * scale;
          const imgR = settings.imageBorderRadius * scale;
          const ctx = canvas.getContext("2d")!;
          if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw;
            canvas.height = bh;
          } else {
            ctx.clearRect(0, 0, bw, bh);
          }

          // Background fill
          ctx.save();
          roundedRect(ctx, 0, 0, bw, bh, r);
          if (settings.bgType === "gradient") {
            const grd = ctx.createLinearGradient(0, 0, bw, bh);
            grd.addColorStop(0, settings.gradientFrom);
            grd.addColorStop(1, settings.gradientTo);
            ctx.fillStyle = grd;
          } else if (settings.bgType === "transparent") {
            ctx.fillStyle = "rgba(0,0,0,0)";
          } else {
            ctx.fillStyle = settings.bgColor;
          }
          ctx.fill();
          ctx.restore();

          // Shadow + rounded image via temp canvas (no black fill bleeding)
          {
            const temp = document.createElement("canvas");
            temp.width = dispW;
            temp.height = dispH;
            const tctx = temp.getContext("2d")!;
            tctx.drawImage(img, 0, 0, dispW, dispH);
            if (imgR > 0) {
              tctx.save();
              tctx.globalCompositeOperation = "destination-in";
              roundedRect(tctx, 0, 0, dispW, dispH, imgR);
              tctx.fillStyle = "#000000";
              tctx.fill();
              tctx.restore();
            }
            ctx.save();
            ctx.shadowOffsetX = sw.x * scale;
            ctx.shadowOffsetY = sw.y * scale;
            ctx.shadowBlur = sw.blur * scale;
            ctx.shadowColor = (() => {
              const { r: cr, g: cg, b: cb } = hexToRgb(sw.color);
              return `rgba(${cr},${cg},${cb},${sw.opacity / 100})`;
            })();
            ctx.drawImage(temp, ox, oy);
            ctx.restore();
          }

          resolve();
        };
        img.src = image;
      });
    },
    [image, settings],
  );


  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDownload = async () => {
    const canvas = document.createElement("canvas");
    await renderToCanvas(canvas, 1);
    const link = document.createElement("a");
    link.download = "styled-screenshot.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = async () => {
    const canvas = document.createElement("canvas");
    await renderToCanvas(canvas, 1);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  const update = (patch: Partial<StyleSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));
  const updateShadow = (patch: Partial<ShadowSettings>) =>
    setSettings((s) => ({ ...s, shadow: { ...s.shadow, ...patch } }));

  return (
    <div
      className="flex h-screen overflow-hidden flex-col bg-background text-foreground font-sans transition-colors duration-300"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            title="ScreenStyler"
          >
            <img src="/logo.svg" alt="ScreenStyler" className="w-7 h-7" />
          </div>
          <span className="font-bold text-base tracking-tight select-none">
            ScreenStyler
          </span>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title={dark ? "Light mode" : "Dark mode"}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors active:scale-[0.96]"
        >
          <div className="relative w-5 h-5">
            <AnimatePresence initial={false}>
              {dark ? (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, scale: 0.25 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.25 }}
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sun className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, scale: 0.25 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.25 }}
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Moon className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 px-6 py-4 w-full overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 h-full max-h-full min-h-0">
            {/* LEFT PANEL */}
            <div
              className="w-full lg:w-[30%] bg-card rounded-2xl flex flex-col gap-6 p-6 min-h-0 overflow-y-auto"
              style={{
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <h2 className="text-base font-semibold text-foreground">
                Upload &amp; Settings
              </h2>

              {/* Upload area */}
              <div
                className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 py-10 px-6 text-center ${
                  isDragging
                    ? "border-[#2779a7] bg-accent"
                    : "border-[#49c5b6] bg-accent hover:border-[#2779a7]"
                }`}
                style={{ borderRadius: 12 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#49c5b6,#2779a7)",
                  }}
                >
                  <Upload className="w-6 h-6 text-white" />
                </div>
                {image ? (
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Image loaded
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop your screenshot or{" "}
                      <span className="text-[#49c5b6]">click to browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, WebP — any size
                    </p>
                  </div>
                )}
              </div>

              {/* Styling controls */}
              <div className="flex flex-col gap-5">
                <SectionLabel>Styling Controls</SectionLabel>

                {/* Background */}
                <ControlRow label="Background">
                  <div className="flex items-center gap-2 flex-wrap min-h-[44px]">
                    <BgToggle
                      active={settings.bgType === "solid"}
                      onClick={() => update({ bgType: "solid" })}
                    >
                      Solid
                    </BgToggle>
                    <BgToggle
                      active={settings.bgType === "gradient"}
                      onClick={() => update({ bgType: "gradient" })}
                    >
                      Gradient
                    </BgToggle>
                    <BgToggle
                      active={settings.bgType === "transparent"}
                      onClick={() => update({ bgType: "transparent" })}
                    >
                      None
                    </BgToggle>
                    {settings.bgType === "solid" && (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <span className="flex items-center justify-center h-10 min-w-10 p-1.5 rounded-md border border-border shadow-sm cursor-pointer">
                          <span
                            className="w-5 h-5 rounded-sm"
                            style={{ background: settings.bgColor }}
                          />
                        </span>
                        <input
                          type="color"
                          value={settings.bgColor}
                          onChange={(e) => update({ bgColor: e.target.value })}
                          className="sr-only"
                        />
                      </label>
                    )}
                    {settings.bgType === "gradient" && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <span className="flex items-center justify-center h-10 min-w-10 p-1.5 rounded-md border border-border shadow-sm cursor-pointer transition-shadow group-hover:shadow-md">
                            <span
                              className="w-5 h-5 rounded-sm"
                              style={{ background: settings.gradientFrom }}
                            />
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">From</span>
                          <input
                            type="color"
                            value={settings.gradientFrom}
                            onChange={(e) =>
                              update({ gradientFrom: e.target.value })
                            }
                            className="sr-only"
                          />
                        </label>
                        <span className="text-xs text-muted-foreground/50">→</span>
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <span className="flex items-center justify-center h-10 min-w-10 p-1.5 rounded-md border border-border shadow-sm cursor-pointer transition-shadow group-hover:shadow-md">
                            <span
                              className="w-5 h-5 rounded-sm"
                              style={{ background: settings.gradientTo }}
                            />
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">To</span>
                          <input
                            type="color"
                            value={settings.gradientTo}
                            onChange={(e) =>
                              update({ gradientTo: e.target.value })
                            }
                            className="sr-only"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </ControlRow>

                {/* Padding */}
                <ControlRow label={`Padding — ${settings.padding}px`}>
                  <StyledSlider
                    min={0}
                    max={80}
                    value={settings.padding}
                    onChange={(v) => update({ padding: v })}
                  />
                </ControlRow>

                {/* Background size */}
                <ControlRow label="Canvas Size">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      W
                      <input
                        type="number"
                        min={200}
                        max={7680}
                        step={10}
                        value={settings.bgWidth}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!isNaN(v)) update({ bgWidth: v });
                        }}
                        onBlur={() => update({ bgWidth: Math.max(200, Math.min(7680, settings.bgWidth)) })}
                        className="w-20 h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground font-mono text-center"
                      />
                    </label>
                    <span className="text-xs text-muted-foreground/50">×</span>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      H
                      <input
                        type="number"
                        min={200}
                        max={4320}
                        step={10}
                        value={settings.bgHeight}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!isNaN(v)) update({ bgHeight: v });
                        }}
                        onBlur={() => update({ bgHeight: Math.max(200, Math.min(4320, settings.bgHeight)) })}
                        className="w-20 h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground font-mono text-center"
                      />
                    </label>
                  </div>
                </ControlRow>

                {/* Background border radius */}
                <ControlRow
                  label={`Bg Radius — ${settings.borderRadius}px`}
                >
                  <StyledSlider
                    min={0}
                    max={48}
                    value={settings.borderRadius}
                    onChange={(v) => update({ borderRadius: v })}
                  />
                </ControlRow>

                {/* Image border radius */}
                <ControlRow
                  label={`Image Radius — ${settings.imageBorderRadius}px`}
                >
                  <StyledSlider
                    min={0}
                    max={48}
                    value={settings.imageBorderRadius}
                    onChange={(v) => update({ imageBorderRadius: v })}
                  />
                </ControlRow>

                {/* Shadow */}
                <div className="space-y-3">
                  <SectionLabel>Shadow</SectionLabel>
                  <ControlRow label={`Offset X — ${settings.shadow.x}px`}>
                    <StyledSlider
                      min={-40}
                      max={40}
                      value={settings.shadow.x}
                      onChange={(v) => updateShadow({ x: v })}
                    />
                  </ControlRow>
                  <ControlRow label={`Offset Y — ${settings.shadow.y}px`}>
                    <StyledSlider
                      min={-40}
                      max={40}
                      value={settings.shadow.y}
                      onChange={(v) => updateShadow({ y: v })}
                    />
                  </ControlRow>
                  <ControlRow label={`Blur — ${settings.shadow.blur}px`}>
                    <StyledSlider
                      min={0}
                      max={80}
                      value={settings.shadow.blur}
                      onChange={(v) => updateShadow({ blur: v })}
                    />
                  </ControlRow>
                  <ControlRow label={`Spread — ${settings.shadow.spread}px`}>
                    <StyledSlider
                      min={-20}
                      max={40}
                      value={settings.shadow.spread}
                      onChange={(v) => updateShadow({ spread: v })}
                    />
                  </ControlRow>
                  <ControlRow label={`Opacity — ${settings.shadow.opacity}%`}>
                    <StyledSlider
                      min={0}
                      max={100}
                      value={settings.shadow.opacity}
                      onChange={(v) => updateShadow({ opacity: v })}
                    />
                  </ControlRow>
                  <ControlRow label="Color">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span className="flex items-center justify-center h-10 min-w-10 p-1.5 rounded-md border border-border shadow-sm cursor-pointer">
                        <span
                          className="w-5 h-5 rounded-sm"
                          style={{ background: settings.shadow.color }}
                        />
                      </span>
                      <input
                        type="color"
                        value={settings.shadow.color}
                        onChange={(e) =>
                          updateShadow({ color: e.target.value })
                        }
                        className="sr-only"
                      />
                      <span className="text-xs text-muted-foreground font-mono">
                        {settings.shadow.color}
                      </span>
                    </label>
                  </ControlRow>
                </div>

                {/* Reset */}
                <button
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#2779a7] transition-colors self-start mt-1 active:scale-[0.96] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to defaults
                </button>
              </div>
            </div>

            {/* RIGHT PANEL */}
          <div
            className="w-full lg:w-[70%] bg-card rounded-2xl flex flex-col min-h-0 overflow-hidden"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.05)" }}
          >
              {/* Preview area */}
                <div
                  className="flex-1 flex items-center justify-center p-8 rounded-t-2xl overflow-hidden min-h-0"
                  style={{
                    background: dark
                      ? "repeating-conic-gradient(#1e2330 0% 25%, #252a3a 0% 50%) 0 0 / 20px 20px"
                      : "repeating-conic-gradient(#F3F4F6 0% 25%, #FFFFFF 0% 50%) 0 0 / 20px 20px",
                  }}
                >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Styled preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Actions */}
              <div className="p-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={!image}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-[opacity,filter,transform] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] hover:brightness-90"
                  style={{
                    background: image
                      ? "linear-gradient(135deg,#49c5b6,#3db5a7)"
                      : "#49c5b6",
                    boxShadow: image
                      ? "0 2px 8px rgba(73,197,182,0.35)"
                      : "none",
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download styled image
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!image}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-[opacity,filter,transform] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] hover:brightness-90"
                  style={{
                    background: "#2779a7",
                    boxShadow: image
                      ? "0 2px 8px rgba(39,121,167,0.3)"
                      : "none",
                  }}
                >
                  <Clipboard className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy to clipboard"}
                </button>
              </div>
            </div>
          </div>
    </main>

      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/* ---- Sub-components ---- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function ControlRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

function BgToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors border active:scale-[0.96] cursor-pointer"
      style={{
        background: active ? "#49c5b6" : "var(--muted)",
        color: active ? "#fff" : "var(--muted-foreground)",
        borderColor: active ? "#49c5b6" : "var(--border)",
      }}
    >
      {children}
    </button>
  );
}

function StyledSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative h-5 flex items-center">
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,#49c5b6,#2779a7)",
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="relative w-full appearance-none bg-transparent cursor-pointer"
        style={{ WebkitAppearance: "none" } as React.CSSProperties}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #49c5b6;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: grab;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          border-color: #2779a7;
          box-shadow: 0 2px 8px rgba(73,197,182,0.25);
        }
        input[type=range]:active::-webkit-slider-thumb {
          cursor: grabbing;
        }
        input[type=range]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #49c5b6;
          cursor: grab;
        }
        input[type=range]:active::-moz-range-thumb {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="w-64 h-44 rounded-2xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-background">
          <Image
            className="w-7 h-7"
            style={{ color: "#49c5b6", opacity: 0.7 }}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground text-balance">
            No image yet
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Upload to see your preview
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-balance">
        Your styled screenshot will appear here
      </p>
    </div>
  );
}

/* ---- Canvas helper ---- */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
