import React, { useState, useRef } from "react";
import { ZoomIn, ZoomOut, X, RotateCcw } from "lucide-react";

interface MouseTrackZoomProps {
  children: React.ReactNode;
  className?: string;
}

export const MouseTrackZoom: React.FC<MouseTrackZoomProps> = ({ children, className = "" }) => {
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transform: 'scale(1)',
    transformOrigin: 'center center',
  });
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(1.5)',
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center center',
    });
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMoveModal = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y
    });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  // Try to retrieve the direct image source
  let imgSrc = "";
  if (React.isValidElement(children)) {
    imgSrc = (children.props as any).src || "";
  }

  return (
    <div 
      className={`overflow-hidden relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      <div 
        style={{
          ...zoomStyle,
          transition: 'transform 0.1s ease-out, transform-origin 0.1s ease-out',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>

      {/* Tap-To-Zoom Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="absolute right-3 bottom-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg ring-1 ring-slate-200/60 backdrop-blur-md transition-all hover:scale-110 active:scale-95 sm:h-9 sm:w-9"
        title="Zoom details"
      >
        <ZoomIn size={18} className="stroke-[2.5] sm:size-15" />
      </button>

      {/* Modal Lightbox */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-950/98 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8 select-none"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(false);
          }}
        >
          {/* Header */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="rounded-full bg-white/10 p-2.5 text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Main Stage */}
          <div 
            className="relative w-full flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveModal}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
          >
            {imgSrc ? (
              <img 
                src={imgSrc} 
                alt="Zoomed details" 
                onClick={handleImageClick}
                className="max-h-[75vh] max-w-full object-contain select-none pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  transformOrigin: 'center center',
                }}
              />
            ) : (
              <div 
                onClick={handleImageClick}
                className="max-h-[75vh] max-w-full flex items-center justify-center"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {children}
              </div>
            )}
          </div>

          {/* Instructions / Help */}
          <div className="text-[10px] md:text-xs text-white/40 font-mono mb-4 text-center">
            {scale > 1 
              ? "Drag to explore zoomed details • Tap to zoom out" 
              : "Double tap / Single tap to zoom • Tap outside to close"}
          </div>

          {/* Controls Panel */}
          <div 
            className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2 backdrop-blur-md shadow-lg border border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 rounded-full bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="Zoom Out"
            >
              <ZoomOut size={16} className="stroke-[2.5]" />
            </button>

            <span className="text-white/90 text-xs font-mono font-bold min-w-[3.5rem] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-1.5 rounded-full bg-white/5 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="Zoom In"
            >
              <ZoomIn size={16} className="stroke-[2.5]" />
            </button>

            {scale > 1 && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-full bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition"
                title="Reset Zoom"
              >
                <RotateCcw size={16} className="stroke-[2]" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MouseTrackZoom;
