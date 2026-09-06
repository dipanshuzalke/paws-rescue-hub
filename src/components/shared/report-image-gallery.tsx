import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ReportImageGallery({
  images,
  alt,
  className = "",
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [imageOpen, setImageOpen] = useState(false);

  if (images.length === 0) return null;

  const activeImage = images[activeImg] ?? images[0];

  return (
    <div className={className}>
      <button
        type="button"
        className="block aspect-video w-full overflow-hidden rounded-lg bg-muted"
        onClick={() => setImageOpen(true)}
        aria-label="View report image full screen"
      >
        <img src={activeImage} alt={alt} className="h-full w-full object-cover" />
      </button>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveImg(index)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                index === activeImg ? "border-primary" : "border-transparent"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="h-dvh w-screen max-w-none rounded-none border-0 bg-black/95 p-2 text-white [&>button]:text-white [&>button]:opacity-100 sm:h-[95vh] sm:w-[95vw] sm:rounded-lg">
          <DialogTitle className="sr-only">Report image</DialogTitle>
          <div className="flex h-full items-center justify-center">
            <img src={activeImage} alt={alt} className="max-h-full max-w-full object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
