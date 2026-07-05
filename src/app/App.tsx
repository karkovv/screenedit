import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useLang } from "../translations/LangProvider";
import type { StringKey } from "../translations/strings";
import ReactCrop, { type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Sketch from "@uiw/react-color-sketch";
import { useMediaQuery } from "./useMediaQuery";
import { Logo } from "./Logo";

import {
  Upload,
  Download,
  Clipboard,
  RotateCcw,
  Image,
  Sun,
  Moon,
  X,
  ChevronDown,
  Crop,
  Check,
  Undo2,
  Redo2,
  Palette,
  Maximize2,
  Square,
  Layers,
} from "lucide-react";

function useTheme() {
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
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
  gradientAngle: number;
  bgWidth: number;
  bgHeight: number;
  borderRadius: number;
  imageBorderRadius: number;
  shadow: ShadowSettings;
  shadowEnabled: boolean;
  imageSize: number;
  position: "center" | "top-left" | "top" | "top-right" | "left" | "right" | "bottom-left" | "bottom" | "bottom-right";
}

interface Snapshot {
  image: string | null;
  settings: StyleSettings;
}

const DEFAULT_SETTINGS: StyleSettings = {
  bgType: "solid",
  bgColor: "#ffffff",
  gradientFrom: "#49c5b6",
  gradientTo: "#2779a7",
  gradientAngle: 135,
  bgWidth: 1920,
  bgHeight: 1080,
  borderRadius: 16,
  imageBorderRadius: 0,
  shadow: { x: 0, y: 8, blur: 32, spread: 0, color: "#000000", opacity: 20 },
  shadowEnabled: true,
  imageSize: 75,
  position: "center",
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getGradientCoords(bw: number, bh: number, angleDeg: number) {
  const angle = (angleDeg * Math.PI) / 180;
  const cx = bw / 2;
  const cy = bh / 2;
  const hd = Math.sqrt(cx * cx + cy * cy);
  return {
    x0: cx - Math.sin(angle) * hd,
    y0: cy + Math.cos(angle) * hd,
    x1: cx + Math.sin(angle) * hd,
    y1: cy - Math.cos(angle) * hd,
  };
}

function getPosition(pos: StyleSettings["position"]): { fx: number; fy: number } {
  const map: Record<string, { fx: number; fy: number }> = {
    "top-left": { fx: 0, fy: 0 },
    "top": { fx: 0.5, fy: 0 },
    "top-right": { fx: 1, fy: 0 },
    "left": { fx: 0, fy: 0.5 },
    "center": { fx: 0.5, fy: 0.5 },
    "right": { fx: 1, fy: 0.5 },
    "bottom-left": { fx: 0, fy: 1 },
    "bottom": { fx: 0.5, fy: 1 },
    "bottom-right": { fx: 1, fy: 1 },
  };
  return map[pos];
}

export default function App() {
  const { dark, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();
  const isMobile = !useMediaQuery("(min-width: 1024px)");
  const [activeTab, setActiveTab] = useState<"background" | "canvas" | "corners" | "shadow">("background");
  const [image, setImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<StyleSettings>(DEFAULT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [donationOpen, setDonationOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpeg" | "webp" | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState<import("react-image-crop").Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(undefined);
  const [cropPreviewSrc, setCropPreviewSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imageRef = useRef<string | null>(null);
  const settingsRef = useRef<StyleSettings>(DEFAULT_SETTINGS);
  imageRef.current = image;
  settingsRef.current = settings;
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const saveState = () => {
    undoStack.current.push({ image, settings });
    redoStack.current = [];
  };
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const imageBitmapRef = useRef<ImageBitmap | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bitmapVersion, setBitmapVersion] = useState(0);
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    background: true,
    layout: true,
    corners: true,
    shadow: true,
  });
  const toggleSection = (id: string) =>
    setSectionsOpen((s) => ({ ...s, [id]: !s[id] }));
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
  }, [image, settings, bitmapVersion]);

  // Pre-decode image to ImageBitmap for zero-decode re-renders
  useEffect(() => {
    if (!image) {
      imageBitmapRef.current?.close();
      imageBitmapRef.current = null;
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      imageBitmapRef.current?.close();
      createImageBitmap(img).then((bm) => {
        if (!cancelled) {
          imageBitmapRef.current = bm;
          setBitmapVersion(v => v + 1);
        }
      });
    };
    img.src = image;
    return () => {
      cancelled = true;
    };
  }, [image]);

  // Generate 0.5x image-only preview for crop mode (same scale as styled preview)
  useEffect(() => {
    if (!cropMode || !image) {
      setCropPreviewSrc(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const sizeFactor = settings.imageSize / 100;
      const bw = settings.bgWidth * 0.5;
      const bh = settings.bgHeight * 0.5;
      const availW = bw * sizeFactor;
      const availH = bh * sizeFactor;
      const fit = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
      const c = document.createElement("canvas");
      const cw = img.naturalWidth * fit;
      const ch = img.naturalHeight * fit;
      if (!(cw > 0) || !(ch > 0)) return;
      c.width = Math.max(1, Math.ceil(cw));
      c.height = Math.max(1, Math.ceil(ch));
      const ctx = c.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setCropPreviewSrc(c.toDataURL("image/png"));
    };
    img.src = image;
  }, [cropMode, image, settings]);

  // Render styled image to canvas
  const renderToCanvas = useCallback(
    (canvas: HTMLCanvasElement, scale = 1) => {
      return new Promise<void>((resolve) => {
        if (!image || !imageBitmapRef.current) { resolve(); return; }
        const bitmap = imageBitmapRef.current;
        const sw = settings.shadow;
        const sizeFactor = settings.imageSize / 100;
        const bw = settings.bgWidth * scale;
        const bh = settings.bgHeight * scale;
        const availW = bw * sizeFactor;
        const availH = bh * sizeFactor;
        const fitScale = Math.min(availW / bitmap.width, availH / bitmap.height);
        const dispW = bitmap.width * fitScale;
        const dispH = bitmap.height * fitScale;
        const { fx, fy } = getPosition(settings.position);
        const ox = (bw - dispW) * fx;
        const oy = (bh - dispH) * fy;
        const r = settings.borderRadius * scale;
        const imgR = settings.imageBorderRadius * scale;
        const ctx = canvas.getContext("2d")!;
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = Math.max(1, Math.ceil(bw));
          canvas.height = Math.max(1, Math.ceil(bh));
        } else {
          ctx.clearRect(0, 0, bw, bh);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.save();
        roundedRect(ctx, 0, 0, bw, bh, r);
        ctx.clip();

        if (settings.bgType === "gradient") {
          const { x0, y0, x1, y1 } = getGradientCoords(bw, bh, settings.gradientAngle);
          const grd = ctx.createLinearGradient(x0, y0, x1, y1);
          grd.addColorStop(0, settings.gradientFrom);
          grd.addColorStop(1, settings.gradientTo);
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, bw, bh);
        } else if (settings.bgType === "solid") {
          ctx.fillStyle = settings.bgColor;
          ctx.fillRect(0, 0, bw, bh);
        }

        let temp = tempCanvasRef.current ?? (tempCanvasRef.current = document.createElement("canvas"));
        if (temp.width !== dispW || temp.height !== dispH) {
          temp.width = Math.max(1, Math.ceil(dispW));
          temp.height = Math.max(1, Math.ceil(dispH));
        }
        const tctx = temp.getContext("2d")!;
        tctx.drawImage(bitmap, 0, 0, dispW, dispH);
        if (imgR > 0) {
          tctx.save();
          tctx.globalCompositeOperation = "destination-in";
          roundedRect(tctx, 0, 0, dispW, dispH, imgR);
          tctx.fillStyle = "#000000";
          tctx.fill();
          tctx.restore();
        }
        if (settings.shadowEnabled) {
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
        } else {
          ctx.drawImage(temp, ox, oy);
        }

        ctx.restore();
        resolve();
      });
    },
    [image, settings],
  );


  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Maximum size is 50MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Paste from clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file) handleFile(file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFile]);

  // Close popups on Escape
  useEffect(() => {
    if (!donationOpen && !downloadOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDonationOpen(false);
        setDownloadOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [donationOpen, downloadOpen]);

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    redoStack.current.push({ image: imageRef.current, settings: settingsRef.current });
    setImage(prev.image);
    setSettings(prev.settings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push({ image: imageRef.current, settings: settingsRef.current });
    setImage(next.image);
    setSettings(next.settings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Undo/redo keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleUndo, handleRedo]);

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
    e.target.value = "";
  };

  const clearImage = () => {
    saveState();
    setImage(null);
    setPreviewUrl(null);
    setCropMode(false);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleDownloadFormat = useCallback(async (format: "png" | "jpeg" | "webp") => {
    const canvas = document.createElement("canvas");
    await renderToCanvas(canvas, 1);
    const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const ext = format === "jpeg" ? "jpg" : format;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.download = `styled-screenshot.${ext}`;
      link.href = URL.createObjectURL(blob);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);
    }, mimeType, 1);
    setDownloadOpen(false);
  }, [renderToCanvas]);

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

  const handleReset = () => {
    saveState();
    setSettings(DEFAULT_SETTINGS);
  };

  const handleCropApply = useCallback(() => {
    if (!image || !completedCrop || !imgRef.current) return;
    saveState();
    const imgEl = imgRef.current;
    const img = new window.Image();
    img.onload = () => {
      const scaleX = img.naturalWidth / imgEl.width;
      const scaleY = img.naturalHeight / imgEl.height;
      const sx = completedCrop.x * scaleX;
      const sy = completedCrop.y * scaleY;
      const sw = completedCrop.width * scaleX;
      const sh = completedCrop.height * scaleY;
      const c = document.createElement("canvas");
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      setImage(c.toDataURL("image/png"));
      setCropMode(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
    };
    img.src = image;
  }, [image, completedCrop, settings]);

  const toggleCropMode = useCallback(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCropMode((v) => !v);
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden flex-col bg-background text-foreground font-sans transition-colors duration-300"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-3 border-b border-border bg-card shrink-0">
        <Logo className="h-4 md:h-5 w-auto select-none text-foreground" />
        <div className="flex items-center gap-1 md:gap-1.5">
          <button
            onClick={() => setDonationOpen(true)}
            className="h-8 w-8 md:h-10 md:w-auto md:px-3 flex items-center justify-center gap-1.5 rounded-lg border border-border text-muted-foreground hover:text-[#FF2424] hover:border-red-300 transition-all duration-150 active:scale-[0.96] cursor-pointer text-xs font-medium"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
          >
            <svg width="14" height="12" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#FF2424]">
              <path d="M13.616 24.2483C9.38413 21.2698 1 14.4608 1 8.33328C1 4.28321 4.15789 1 8.5 1C10.75 1 13 1.70588 16 4.52938C19 1.70588 21.25 1 23.5 1C27.8421 1 31 4.28321 31 8.33328C31 14.4608 22.6159 21.2698 18.384 24.2483C16.9599 25.2506 15.0401 25.2506 13.616 24.2483Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden md:inline">{t("donate")}</span>
          </button>
          <button
            onClick={toggleLang}
            aria-label={lang}
            title={lang === "en" ? "Русский" : "English"}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-border font-bold text-[10px] md:text-xs tracking-wider text-muted-foreground hover:bg-muted transition-colors active:scale-[0.96] cursor-pointer"
          >
            {lang === "en" ? "EN" : "RU"}
          </button>
          <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title={dark ? "Light mode" : "Dark mode"}
          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors active:scale-[0.96] cursor-pointer"
        >
          <div className="relative w-4 h-4 md:w-5 md:h-5">
            <AnimatePresence initial={false}>
              {dark ? (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, scale: 0.25 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.25 }}
                  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sun className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, scale: 0.25 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.25 }}
                  transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Moon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 px-4 md:px-6 py-3 md:py-4 w-full overflow-hidden">
        {isMobile ? (
          /* ======== MOBILE LAYOUT ======== */
          <div className="flex flex-col h-full max-h-full min-h-0">
            {/* Preview area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/40 shrink-0">
                <button
                  onClick={toggleCropMode}
                  disabled={!image || cropMode}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96] cursor-pointer"
                >
                  <Crop className="w-3 h-3" />
                  <span className="hidden sm:inline">{t("cropImage")}</span>
                </button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <button
                  onClick={handleUndo}
                  disabled={undoStack.current.length === 0}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-25 disabled:cursor-not-allowed active:scale-[0.96] cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.current.length === 0}
                  className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-25 disabled:cursor-not-allowed active:scale-[0.96] cursor-pointer"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="w-3 h-3" />
                </button>
                {cropMode && (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={handleCropApply}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-white transition-all duration-150 active:scale-[0.96] cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg,#49c5b6,#3db5a7)",
                        boxShadow: "0 1px 3px rgba(73,197,182,0.3)",
                      }}
                    >
                      <Check className="w-3 h-3" />
                      {t("cropApply")}
                    </button>
                    <button
                      onClick={() => setCropMode(false)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 active:scale-[0.96] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      {t("cropCancel")}
                    </button>
                  </div>
                )}
              </div>

              {/* Preview with dropzone */}
              <div
                ref={previewContainerRef}
                className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden min-h-0 relative"
                style={{
                  background: dark
                    ? "repeating-conic-gradient(#3a3a3a 0% 25%, #505050 0% 50%) 0 0 / 16px 16px"
                    : "repeating-conic-gradient(#E5E7EB 0% 25%, #FFFFFF 0% 50%) 0 0 / 16px 16px",
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                {!image && (
                  <label
                    htmlFor="mobile-file-input"
                    className={`absolute inset-3 sm:inset-4 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 p-4 cursor-pointer ${
                      isDragging
                        ? "border-[#2779a7] bg-accent/40"
                        : "border-[#49c5b6] bg-accent/20"
                    }`}
                  >
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#49c5b6,#2779a7)" }}
                    >
                      <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <p className="text-sm font-medium text-foreground text-center">
                      {t("dropScreenshot")}{" "}
                      <span className="text-[#49c5b6]">{t("clickToBrowse")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground text-center">{t("anySize")}</p>
                  </label>
                )}
                <input
                  ref={fileInputRef}
                  id="mobile-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                {cropMode && cropPreviewSrc ? (
                  <div className="absolute inset-[16px] sm:inset-[24px] grid place-items-center" style={{ gridTemplateRows: "1fr", gridTemplateColumns: "1fr" }}>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      ruleOfThirds
                    >
                      <img
                        ref={imgRef}
                        src={cropPreviewSrc}
                        alt="Crop"
                        crossOrigin="anonymous"
                      />
                    </ReactCrop>
                  </div>
                ) : previewUrl ? (
                  <div className="absolute inset-3 sm:inset-4 flex items-center justify-center">
                    {image && (
                      <button
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        aria-label="Remove image"
                        title={t("remove")}
                        className="absolute top-0 right-0 z-10 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-border bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-red-500 hover:border-red-300 transition-all duration-150 active:scale-[0.96] cursor-pointer"
                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    <img
                      src={previewUrl}
                      alt={t("styledPreview")}
                      className="relative z-0 max-w-full max-h-full object-contain block"
                    />
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="p-3 sm:p-4 shrink-0 border-t border-border">
                {downloadOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setDownloadOpen(false)} />
                )}
                <div className="relative z-50">
                  <button
                    onClick={() => setDownloadOpen((v) => !v)}
                    disabled={!image}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-[opacity,filter,transform] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] hover:brightness-90 cursor-pointer"
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
                    {t("downloadStyledImage")}
                  </button>
                  <AnimatePresence>
                    {downloadOpen && (
                      <motion.div
                        className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-xl p-1.5 flex flex-col gap-0.5"
                        style={{ boxShadow: "0 0 0 2px rgba(73,197,182,0.3), 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)", transformOrigin: "bottom center" }}
                        initial={{ opacity: 0, scale: 0.92, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 6 }}
                        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                      >
                        {(["png", "jpeg", "webp"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => handleDownloadFormat(fmt)}
                            className="flex items-center justify-center px-3 py-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 active:scale-[0.96] cursor-pointer"
                          >
                            <span className="uppercase font-semibold text-[10px] tracking-wider min-w-[36px]">{fmt}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Mobile bottom settings panel */}
            <MobileSettingsPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              settings={settings}
              update={update}
              updateShadow={updateShadow}
              t={t}
              handleReset={handleReset}
            />
          </div>
        ) : (
          /* ======== DESKTOP LAYOUT ======== */
          <div className="flex flex-col lg:flex-row gap-6 h-full max-h-full min-h-0">
            {/* LEFT PANEL */}
            <div
              className="w-full lg:w-[25%] bg-card rounded-2xl flex flex-col gap-6 p-6 lg:pl-0 lg:pt-0 min-h-0 overflow-y-auto"
              style={{
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.05)",
                scrollbarGutter: "stable",
              }}
            >
              <h2 className="text-base font-semibold text-foreground">
                {t("uploadAndSettings")}
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
                {image && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearImage(); }}
                    aria-label="Remove image"
                    title={t("remove")}
                    className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-red-500 hover:border-red-300 transition-all duration-150 active:scale-[0.96] cursor-pointer"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
                      {t("imageLoaded")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("clickToReplace")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("dropScreenshot")}{" "}
                      <span className="text-[#49c5b6]">{t("clickToBrowse")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("anySize")}
                    </p>
                  </div>
                )}
              </div>

              {/* Styling controls */}
              <div className="flex flex-col gap-5">

                <CollapsibleSection
                  id="background"
                  label={t("background")}
                  isOpen={sectionsOpen.background}
                  onToggle={toggleSection}
                >
                <BackgroundSettings settings={settings} update={update} t={t} />
                </CollapsibleSection>

                <SettingsDivider />

                <CollapsibleSection
                  id="layout"
                  label={t("layout")}
                  isOpen={sectionsOpen.layout}
                  onToggle={toggleSection}
                >
                <LayoutSettings settings={settings} update={update} t={t} />
                </CollapsibleSection>

                <SettingsDivider />

                <CollapsibleSection
                  id="corners"
                  label={t("corners")}
                  isOpen={sectionsOpen.corners}
                  onToggle={toggleSection}
                >
                <CornersSettings settings={settings} update={update} t={t} />
                </CollapsibleSection>

                <SettingsDivider />

                <CollapsibleSection
                  id="shadow"
                  label={t("shadow")}
                  isOpen={sectionsOpen.shadow}
                  onToggle={toggleSection}
                >
                <ShadowSettings settings={settings} update={update} updateShadow={updateShadow} t={t} />
                </CollapsibleSection>

                {/* Reset */}
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#2779a7] transition-colors self-start mt-1 active:scale-[0.96] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t("resetToDefaults")}
                </button>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border dark:via-border/60 to-transparent shrink-0" />

            {/* RIGHT PANEL */}
            <div
              className="w-full lg:w-[75%] bg-card rounded-2xl flex flex-col min-h-0 overflow-hidden"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.05)" }}
            >
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/40 shrink-0">
                <button
                  onClick={toggleCropMode}
                  disabled={!image || cropMode}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96] cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5" />
                  {t("cropImage")}
                </button>
                <div className="w-px h-5 bg-border mx-1.5" />
                <button
                  onClick={handleUndo}
                  disabled={undoStack.current.length === 0}
                  className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-25 disabled:cursor-not-allowed active:scale-[0.96] cursor-pointer"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.current.length === 0}
                  className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 disabled:opacity-25 disabled:cursor-not-allowed active:scale-[0.96] cursor-pointer"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                {cropMode && (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={handleCropApply}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white transition-all duration-150 active:scale-[0.96] cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg,#49c5b6,#3db5a7)",
                        boxShadow: "0 1px 3px rgba(73,197,182,0.3)",
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t("cropApply")}
                    </button>
                    <button
                      onClick={() => setCropMode(false)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 active:scale-[0.96] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      {t("cropCancel")}
                    </button>
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div
                ref={previewContainerRef}
                className="flex-1 flex items-center justify-center p-8 overflow-hidden min-h-0 relative"
                style={{
                  background: dark
                    ? "repeating-conic-gradient(#3a3a3a 0% 25%, #505050 0% 50%) 0 0 / 20px 20px"
                    : "repeating-conic-gradient(#E5E7EB 0% 25%, #FFFFFF 0% 50%) 0 0 / 20px 20px",
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                {cropMode && cropPreviewSrc ? (
                  <div className="absolute inset-[32px] grid place-items-center" style={{ gridTemplateRows: "1fr", gridTemplateColumns: "1fr" }}>
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      ruleOfThirds
                    >
                      <img
                        ref={imgRef}
                        src={cropPreviewSrc}
                        alt="Crop"
                        crossOrigin="anonymous"
                      />
                    </ReactCrop>
                  </div>
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={t("styledPreview")}
                    className="relative z-0"
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
                {isDragging && (
                  <div className="absolute inset-0 z-10 bg-accent/40 border-2 border-dashed border-[#2779a7] rounded-2xl m-8 pointer-events-none" />
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Actions */}
              <div className="p-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                {downloadOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDownloadOpen(false)}
                  />
                )}
                <div className="relative z-50">
                  <button
                    onClick={() => setDownloadOpen((v) => !v)}
                    disabled={!image}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-[opacity,filter,transform] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] hover:brightness-90 cursor-pointer"
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
                    {t("downloadStyledImage")}
                  </button>
                  <AnimatePresence>
                    {downloadOpen && (
                      <motion.div
                        className="absolute bottom-full left-0 right-0 mb-2 bg-card rounded-xl p-1.5 flex flex-col gap-0.5"
                        style={{ boxShadow: "0 0 0 2px rgba(73,197,182,0.3), 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)", transformOrigin: "bottom center" }}
                        initial={{ opacity: 0, scale: 0.92, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 6 }}
                        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
                      >
                        {(["png", "jpeg", "webp"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => handleDownloadFormat(fmt)}
                            className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 active:scale-[0.96] cursor-pointer"
                          >
                            <span className="uppercase font-semibold text-[10px] tracking-wider min-w-[36px]">{fmt}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!image}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-[opacity,filter,transform] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.96] hover:brightness-90 cursor-pointer"
                  style={{
                    background: "#2779a7",
                    boxShadow: image
                      ? "0 2px 8px rgba(39,121,167,0.3)"
                      : "none",
                  }}
                >
                  <Clipboard className="w-4 h-4" />
                  {copied ? t("copied") : t("copyToClipboard")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <div className="shrink-0 px-5 py-2 border-t border-border bg-card text-center flex items-center justify-center gap-3">
        <Link
          to="/privacy"
          className="text-[11px] text-muted-foreground/60 hover:text-[#49c5b6] transition-colors select-none"
        >
          {t("footerPrivacy")}
        </Link>
      </div>

      {/* Donation popup */}
      <AnimatePresence>
        {donationOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDonationOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
            <motion.div
              className="relative bg-card rounded-2xl p-8 max-w-[430px] w-full text-center flex flex-col items-center gap-5"
              style={{ boxShadow: "0 0 0 2px rgba(73,197,182,0.3), 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)" }}
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            >
              <svg width="48" height="40" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M13.616 24.2483C9.38413 21.2698 1 14.4608 1 8.33328C1 4.28321 4.15789 1 8.5 1C10.75 1 13 1.70588 16 4.52938C19 1.70588 21.25 1 23.5 1C27.8421 1 31 4.28321 31 8.33328C31 14.4608 22.6159 21.2698 18.384 24.2483C16.9599 25.2506 15.0401 25.2506 13.616 24.2483Z" stroke="#FF2424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="text-base font-semibold">{t("donateTitle")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("donateText")}
              </p>
              <img
                src="/qr-donate-donationalers.png"
                alt="DonationAlerts QR"
                className="w-28 h-28 border border-border"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              />
              <a
                href="https://www.donationalerts.com/r/karkov"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-150 active:scale-[0.96] hover:brightness-90"
                style={{
                  background: "#FF2424",
                  boxShadow: "0 2px 8px rgba(255,36,36,0.3)",
                }}
              >
                {t("donateLink")}
              </a>
              <button
                onClick={() => setDonationOpen(false)}
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer"
              >
                {t("close")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Sub-components ---- */

function CollapsibleSection({
  id,
  label,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: any;
}) {
  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => onToggle(id)}
        className="flex items-center gap-1.5 w-full group cursor-pointer text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors duration-150">
          {label}
        </p>
        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <ChevronDown className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors duration-150" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-border dark:via-border/60 to-transparent my-1" />
  );
}

function SectionLabel({ children }: { children: any }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function ControlRow({
  label,
  children,
  labelClassName,
  onReset,
}: {
  label: string;
  children: any;
  labelClassName?: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 group/row">
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-medium text-foreground ${labelClassName ?? ""}`}>{label}</span>
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center justify-center w-4 h-4 rounded text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-all duration-150 opacity-0 group-hover/row:opacity-100 active:scale-[0.96] cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
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
  children: any;
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
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-border overflow-hidden">
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
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="relative w-full appearance-none bg-transparent cursor-pointer"
        style={{ WebkitAppearance: "none" } as React.CSSProperties}
      />
    </div>
  );
}

function EmptyState() {
  const { t } = useLang();
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
            {t("noImageYet")}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {t("uploadToSeePreview")}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-balance">
        {t("yourStyledScreenshot")}
      </p>
    </div>
  );
}

/* ---- Gradient angle indicator ---- */
function GradientAngleIndicator({ angle }: { angle: number }) {
  return (
    <div
      className="relative shrink-0 w-11 h-11 rounded-full border border-border bg-background flex items-center justify-center"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div
        className="absolute w-0.5 h-[14px] rounded-full"
        style={{
          background: "linear-gradient(90deg,#49c5b6,#2779a7)",
          transform: `rotate(${angle}deg)`,
          transformOrigin: "bottom center",
          bottom: "calc(50% - 1px)",
          left: "calc(50% - 1px)",
          transition: "transform 0.15s cubic-bezier(0.2,0,0,1)",
        }}
      />
    </div>
  );
}

const PRESET_COLORS = [
  "#FFFFFF", "#F3F4F6", "#9CA3AF", "#4B5563", "#111111",
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#49C5B6",
  "#2779A7", "#3B82F6", "#8B5CF6", "#EC4899",
];

function ColorPickerSketch({
  color,
  onChange,
  children,
  offsetY = 0,
  presets,
}: {
  color: string;
  onChange: (c: string) => void;
  children: React.ReactNode;
  offsetY?: number;
  presets?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  return (
    <div className="relative">
      {presets && (
        <div className="flex items-center gap-1.5 flex-wrap mb-2 pl-1">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={(e) => { e.stopPropagation(); onChange(preset); }}
              className={`w-6 h-6 rounded-full border border-border cursor-pointer transition-all duration-150 active:scale-[0.96] shrink-0 ${
                color.toLowerCase() === preset.toLowerCase()
                  ? "ring-2 ring-[#49c5b6] scale-110"
                  : "hover:scale-110"
              }`}
              style={{ background: preset }}
            />
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="w-6 h-6 rounded-full border border-border bg-muted flex items-center justify-center cursor-pointer hover:bg-muted-foreground/20 active:scale-[0.96] transition-all duration-150 shrink-0"
            title="Custom color"
          >
            <Palette className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}
      <div
        ref={triggerRef}
        onClick={() => {
          if (!open && triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            const gap = 8;
            const popH = 380;
            const below = r.bottom + gap + popH <= window.innerHeight;
            setPos({
              left: Math.max(8, Math.min(r.left, window.innerWidth - 240)),
              top: (below ? r.bottom + gap : r.top - gap - popH) + offsetY,
            });
          }
          setOpen((v) => !v);
        }}
        className="inline-flex cursor-pointer"
      >
        {children}
      </div>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed z-50"
            style={{ left: pos.left, top: pos.top }}
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <Sketch
              color={color}
              onChange={(c) => onChange(c.hex)}
              disableAlpha
              presetColors={presets ?? [
                "#D0021B", "#F5A623", "#f8e61b", "#8B572A", "#7ED321",
                "#417505", "#BD10E0", "#9013FE", "#4A90E2", "#50E3C2",
              ]}
              style={{ boxShadow: "0 0 0 2px rgba(73,197,182,0.3), 0 4px 24px rgba(0,0,0,0.15)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---- Settings section components ---- */

function BackgroundSettings({
  settings,
  update,
  t,
}: {
  settings: StyleSettings;
  update: (patch: Partial<StyleSettings>) => void;
  t: (key: StringKey) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap min-h-[40px]">
        <BgToggle active={settings.bgType === "solid"} onClick={() => update({ bgType: "solid" })}>
          {t("solid")}
        </BgToggle>
        <BgToggle active={settings.bgType === "gradient"} onClick={() => update({ bgType: "gradient" })}>
          {t("gradient")}
        </BgToggle>
        <BgToggle active={settings.bgType === "transparent"} onClick={() => update({ bgType: "transparent" })}>
          {t("none")}
        </BgToggle>
        <button
          onClick={() => update({ bgType: DEFAULT_SETTINGS.bgType, bgColor: DEFAULT_SETTINGS.bgColor, gradientFrom: DEFAULT_SETTINGS.gradientFrom, gradientTo: DEFAULT_SETTINGS.gradientTo, gradientAngle: DEFAULT_SETTINGS.gradientAngle })}
          className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-all duration-150 opacity-0 hover:opacity-100 active:scale-[0.96] cursor-pointer shrink-0"
          title="Reset background"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
      <AnimatePresence mode="popLayout">
        {settings.bgType === "solid" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            <ColorPickerSketch color={settings.bgColor} onChange={(c) => update({ bgColor: c })} presets={PRESET_COLORS}>
              <span className="inline-flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-background hover:bg-muted shadow-sm cursor-pointer transition-colors duration-150">
                <span className="w-4 h-4 rounded-sm shrink-0" style={{ background: settings.bgColor }} />
                <span className="text-xs font-mono tabular-nums text-muted-foreground">{settings.bgColor}</span>
              </span>
            </ColorPickerSketch>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {settings.bgType === "gradient" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <ColorPickerSketch color={settings.gradientFrom} onChange={(c) => update({ gradientFrom: c })}>
                    <span className="flex items-center justify-center h-10 min-w-10 p-1.5 rounded-md border border-border shadow-sm cursor-pointer transition-shadow group-hover:shadow-md">
                      <span className="w-5 h-5 rounded-sm" style={{ background: settings.gradientFrom }} />
                    </span>
                  </ColorPickerSketch>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("from")}</span>
                </label>
                <span className="text-xs text-muted-foreground/50">→</span>
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <ColorPickerSketch color={settings.gradientTo} onChange={(c) => update({ gradientTo: c })}>
                    <span className="flex items-center justify-center h-10 min-w-10 p-1.5 rounded-md border border-border shadow-sm cursor-pointer transition-shadow group-hover:shadow-md">
                      <span className="w-5 h-5 rounded-sm" style={{ background: settings.gradientTo }} />
                    </span>
                  </ColorPickerSketch>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("to")}</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <GradientAngleIndicator angle={settings.gradientAngle} />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <StyledSlider min={0} max={360} value={settings.gradientAngle} onChange={(v) => update({ gradientAngle: v })} />
                  </div>
                  <label className="flex items-center gap-0.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={settings.gradientAngle}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v)) update({ gradientAngle: Math.max(0, Math.min(360, v)) });
                      }}
                      className="w-14 h-8 rounded-md border border-border bg-background px-1 text-base text-foreground font-mono text-center tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground font-mono">°</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PositionGrid({
  position,
  onChange,
}: {
  position: StyleSettings["position"];
  onChange: (p: StyleSettings["position"]) => void;
}) {
  const positions: StyleSettings["position"][] = [
    "top-left", "top", "top-right",
    "left", "center", "right",
    "bottom-left", "bottom", "bottom-right",
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5 w-fit">
      {positions.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          title={p}
          className={`w-7 h-7 rounded-md border transition-all duration-150 active:scale-[0.96] cursor-pointer ${
            p === position
              ? "bg-[#49c5b6] border-[#49c5b6] shadow-sm"
              : "bg-muted border-border hover:border-[#49c5b6]/50 hover:bg-muted-foreground/10"
          }`}
        />
      ))}
    </div>
  );
}

function LayoutSettings({
  settings,
  update,
  t,
}: {
  settings: StyleSettings;
  update: (patch: Partial<StyleSettings>) => void;
  t: (key: StringKey) => string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ControlRow label={t("canvasSize")} onReset={() => update({ bgWidth: DEFAULT_SETTINGS.bgWidth, bgHeight: DEFAULT_SETTINGS.bgHeight })}>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            W
            <input
              type="number"
              min={200}
              max={7680}
              step={10}
               value={settings.bgWidth || ""}
              onChange={(e) => { if (e.target.value === "") { update({ bgWidth: 0 }); return; } const v = Number(e.target.value); if (!isNaN(v)) update({ bgWidth: v }); }}
              onBlur={() => update({ bgWidth: Math.max(200, Math.min(7680, settings.bgWidth)) })}
              className="w-18 h-8 rounded-md border border-border bg-background px-1 text-base text-foreground font-mono text-center tabular-nums"
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
               value={settings.bgHeight || ""}
              onChange={(e) => { if (e.target.value === "") { update({ bgHeight: 0 }); return; } const v = Number(e.target.value); if (!isNaN(v)) update({ bgHeight: v }); }}
              onBlur={() => update({ bgHeight: Math.max(200, Math.min(4320, settings.bgHeight)) })}
              className="w-18 h-8 rounded-md border border-border bg-background px-1 text-base text-foreground font-mono text-center tabular-nums"
            />
          </label>
        </div>
      </ControlRow>
      <ControlRow label={`${t("imageSize")} — ${settings.imageSize}%`} onReset={() => update({ imageSize: DEFAULT_SETTINGS.imageSize })}>
        <StyledSlider min={10} max={100} value={settings.imageSize} onChange={(v) => update({ imageSize: v })} />
      </ControlRow>
      <ControlRow label="Положение" labelClassName="mb-1" onReset={() => update({ position: DEFAULT_SETTINGS.position })}>
        <div className="flex flex-col items-center">
          <PositionGrid position={settings.position} onChange={(p) => update({ position: p })} />
        </div>
      </ControlRow>
    </div>
  );
}

function CornersSettings({
  settings,
  update,
  t,
}: {
  settings: StyleSettings;
  update: (patch: Partial<StyleSettings>) => void;
  t: (key: StringKey) => string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <ControlRow label={`${t("bgRadius")} — ${settings.borderRadius}px`} onReset={() => update({ borderRadius: DEFAULT_SETTINGS.borderRadius })}>
        <StyledSlider min={0} max={100} value={settings.borderRadius} onChange={(v) => update({ borderRadius: v })} />
      </ControlRow>
      <ControlRow label={`${t("imageRadius")} — ${settings.imageBorderRadius}px`} onReset={() => update({ imageBorderRadius: DEFAULT_SETTINGS.imageBorderRadius })}>
        <StyledSlider min={0} max={100} value={settings.imageBorderRadius} onChange={(v) => update({ imageBorderRadius: v })} />
      </ControlRow>
    </div>
  );
}

function ShadowSettings({
  settings,
  update,
  updateShadow,
  t,
}: {
  settings: StyleSettings;
  update: (patch: Partial<StyleSettings>) => void;
  updateShadow: (patch: Partial<ShadowSettings>) => void;
  t: (key: StringKey) => string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 pl-0.5">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.shadowEnabled}
            onChange={(e) => update({ shadowEnabled: e.target.checked })}
            className="sr-only"
          />
          <span
            className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${settings.shadowEnabled ? "bg-[#49c5b6]" : "bg-border"}`}
            style={settings.shadowEnabled ? { boxShadow: "0 0 0 1px rgba(73,197,182,0.3)" } : undefined}
          >
            <span className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${settings.shadowEnabled ? "translate-x-[18px]" : "translate-x-0"}`} />
          </span>
        </label>
        <span className="text-xs text-muted-foreground select-none">{settings.shadowEnabled ? "On" : "Off"}</span>
      </div>
      {settings.shadowEnabled && (
        <>
          <ControlRow label={`${t("offsetX")} — ${settings.shadow.x}px`} onReset={() => updateShadow({ x: DEFAULT_SETTINGS.shadow.x })}>
            <StyledSlider min={-40} max={40} value={settings.shadow.x} onChange={(v) => updateShadow({ x: v })} />
          </ControlRow>
          <ControlRow label={`${t("offsetY")} — ${settings.shadow.y}px`} onReset={() => updateShadow({ y: DEFAULT_SETTINGS.shadow.y })}>
            <StyledSlider min={-40} max={40} value={settings.shadow.y} onChange={(v) => updateShadow({ y: v })} />
          </ControlRow>
          <ControlRow label={`${t("blur")} — ${settings.shadow.blur}px`} onReset={() => updateShadow({ blur: DEFAULT_SETTINGS.shadow.blur })}>
            <StyledSlider min={0} max={80} value={settings.shadow.blur} onChange={(v) => updateShadow({ blur: v })} />
          </ControlRow>
          <ControlRow label={`${t("spread")} — ${settings.shadow.spread}px`} onReset={() => updateShadow({ spread: DEFAULT_SETTINGS.shadow.spread })}>
            <StyledSlider min={-20} max={40} value={settings.shadow.spread} onChange={(v) => updateShadow({ spread: v })} />
          </ControlRow>
          <ControlRow label={`${t("opacity")} — ${settings.shadow.opacity}%`} onReset={() => updateShadow({ opacity: DEFAULT_SETTINGS.shadow.opacity })}>
            <StyledSlider min={0} max={100} value={settings.shadow.opacity} onChange={(v) => updateShadow({ opacity: v })} />
          </ControlRow>
          <ControlRow label={t("color")} onReset={() => updateShadow({ color: DEFAULT_SETTINGS.shadow.color })}>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <ColorPickerSketch color={settings.shadow.color} onChange={(c) => updateShadow({ color: c })} offsetY={55} presets={PRESET_COLORS}>
                <span className="flex items-center justify-center h-10 min-w-10 p-1.5 rounded-md border border-border shadow-sm cursor-pointer">
                  <span className="w-5 h-5 rounded-sm" style={{ background: settings.shadow.color }} />
                </span>
              </ColorPickerSketch>
              <span className="text-xs text-muted-foreground font-mono">{settings.shadow.color}</span>
            </label>
          </ControlRow>
        </>
      )}
    </div>
  );
}

/* ---- Mobile bottom settings panel ---- */

type TabId = "background" | "canvas" | "corners" | "shadow";

const TAB_CONFIG: { id: TabId; labelKey: StringKey; icon: typeof Palette }[] = [
  { id: "background", labelKey: "background", icon: Palette },
  { id: "canvas",    labelKey: "layout",     icon: Maximize2 },
  { id: "corners",   labelKey: "corners",    icon: Square },
  { id: "shadow",    labelKey: "shadow",     icon: Layers },
];

function MobileSettingsPanel({
  activeTab,
  onTabChange,
  settings,
  update,
  updateShadow,
  t,
  handleReset,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  settings: StyleSettings;
  update: (patch: Partial<StyleSettings>) => void;
  updateShadow: (patch: Partial<ShadowSettings>) => void;
  t: (key: StringKey) => string;
  handleReset: () => void;
}) {
  return (
    <div
      className="shrink-0 flex flex-col bg-card border-t border-border"
      style={{ boxShadow: "0 -1px 3px rgba(0,0,0,0.06), 0 -4px 16px rgba(0,0,0,0.04)" }}
    >
      <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: "35vh" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {activeTab === "background" && (
              <BackgroundSettings settings={settings} update={update} t={t} />
            )}
            {activeTab === "canvas" && (
              <LayoutSettings settings={settings} update={update} t={t} />
            )}
            {activeTab === "corners" && (
              <CornersSettings settings={settings} update={update} t={t} />
            )}
            {activeTab === "shadow" && (
              <ShadowSettings settings={settings} update={update} updateShadow={updateShadow} t={t} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between px-3 pt-2 pb-1 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-0.5">
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.96] cursor-pointer min-w-[44px] justify-center ${
                  isActive
                    ? "bg-[#49c5b6] text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                style={isActive ? { boxShadow: "0 1px 3px rgba(73,197,182,0.3)" } : undefined}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-all duration-150 active:scale-[0.96] cursor-pointer shrink-0"
          title={t("resetToDefaults")}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
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
