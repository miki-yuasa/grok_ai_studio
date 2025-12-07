"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImagePreview({ src, alt, className }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScale(1);
  };

  return (
    <>
      {/* Thumbnail with zoom overlay */}
      <div className="relative group">
        <img
          src={src}
          alt={alt}
          className={className}
        />
        <div
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
          onClick={() => setIsOpen(true)}
        >
          <div className="bg-white/90 dark:bg-black/90 rounded-full p-3">
            <Maximize2 className="h-6 w-6 text-foreground" />
          </div>
        </div>
      </div>

      {/* Full screen dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <span className="text-xs font-medium">{Math.round(scale * 100)}%</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable image container */}
          <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
            <img
              src={src}
              alt={alt}
              className="transition-transform duration-200"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center",
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
