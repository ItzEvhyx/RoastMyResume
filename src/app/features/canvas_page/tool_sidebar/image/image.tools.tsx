'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Poppins } from 'next/font/google';
import { useText } from '../../context/TextContext';
import { useIcon } from '../../context/IconContext';
import { useMediaQuery } from '@/lib/use_media_query';
import { useImageDragToFrame, DragActiveOverlay } from './image.attach.frame';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});

const FUTURA_STYLE = `
  @font-face {
    font-family: 'FuturaDisplay';
    src: url('/assets/fonts/futura_display/Futura Display.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

const CANVAS_WIDTH = 794;
const CANVAS_HEIGHT = 1123;
const DEFAULT_SIZE = 200;
const MAX_IMAGES = 10;

interface UploadedImage {
  id: string;
  dataUrl: string;
  name: string;
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 pb-6">
      <div
        style={{
          width: 120,
          height: 120,
          backgroundColor: 'rgba(255,255,255,0.18)',
          WebkitMaskImage: "url('/assets/tools_icons/frame_icon.png')",
          maskImage: "url('/assets/tools_icons/frame_icon.png')",
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />

      <span
        style={{
          fontFamily: 'FuturaDisplay, sans-serif',
          fontSize: 30,
          color: '#fff',
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}
      >
        NO UPLOADS YET
      </span>

      <button
        type="button"
        onClick={onUpload}
        className="transition-all duration-150 active:scale-95 hover:opacity-90"
        style={{
          background: '#fff',
          color: '#1a1b1f',
          fontFamily: 'var(--font-poppins)',
          fontWeight: 600,
          fontSize: 15,
          borderRadius: 999,
          padding: '11px 28px',
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Upload Resume Photo
      </button>

      <span
        style={{
          fontFamily: 'var(--font-poppins)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          textAlign: 'center',
        }}
      >
        Accepts PNG and JPG only
      </span>
    </div>
  );
}

function ImageThumbnail({
  image,
  isChecked,
  onToggleCheck,
  onPlace,
}: {
  image: UploadedImage;
  isChecked: boolean;
  onToggleCheck: (e: React.MouseEvent) => void;
  onPlace: () => void;
}) {
  const { isDragging, dragHandlers } = useImageDragToFrame(image.dataUrl);

  return (
    <div
      {...dragHandlers}
      className="relative overflow-hidden rounded-2xl"
      style={{
        aspectRatio: '1 / 1',
        border: isChecked
          ? '2px solid rgba(255,255,255,0.75)'
          : '1px solid rgba(255,255,255,0.10)',
        cursor: 'grab',
        opacity: isDragging ? 0.55 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      {/* Drag-active overlay */}
      <DragActiveOverlay visible={isDragging} />

      {/* Image — clicking places it on canvas */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.dataUrl}
        alt={image.name}
        draggable={false}
        onClick={onPlace}
        className="transition-opacity duration-150 hover:opacity-80 active:opacity-60"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Checkbox — top-right corner */}
      <button
        type="button"
        aria-label={isChecked ? 'Deselect image' : 'Select image'}
        onClick={onToggleCheck}
        className="absolute top-1.5 right-1.5 flex items-center justify-center transition-transform duration-100 active:scale-90"
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          border: isChecked ? '2px solid #fff' : '2px solid rgba(255,255,255,0.6)',
          background: isChecked ? '#fff' : 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          padding: 0,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {isChecked && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path
              d="M2 5.5L4.5 8L9 3"
              stroke="#1a1b1f"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

/** The desktop image upload panel opened from the Image Upload item in the left toolbar. */
export default function ImageTools() {
  const { toolbarExpanded, activeTool } = useText();
  const { addFullIconElement } = useIcon();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const shouldShow = toolbarExpanded && activeTool === 'image';

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f =>
      f.type === 'image/png' || f.type === 'image/jpeg'
    );
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        setImages(prev => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [
            {
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              dataUrl: reader.result as string,
              name: file.name,
            },
            ...prev,
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deleteSelected = () => {
    setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
  };

  const placeImage = (image: UploadedImage) => {
    addFullIconElement({
      x: Math.round((CANVAS_WIDTH - DEFAULT_SIZE) / 2),
      y: Math.round((CANVAS_HEIGHT - DEFAULT_SIZE) / 2),
      size: DEFAULT_SIZE,
      width: DEFAULT_SIZE,
      height: DEFAULT_SIZE,
      isShape: false,
      svgUrl: image.dataUrl,
      color: '#000000',
    });
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FUTURA_STYLE }} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <aside
        data-mobile-tool-panel
        aria-label="Photos"
        className={`fixed z-50 flex flex-col overflow-hidden rounded-3xl ${poppins.variable}`}
        style={{
          left: isMobile ? 16 : 110,
          right: isMobile ? 16 : undefined,
          top: isMobile ? undefined : 'calc(50% - (100vh - 200px) / 2 + 40px)',
          bottom: isMobile ? 92 : undefined,
          width: isMobile ? 'auto' : 360,
          height: isMobile ? 'min(360px, calc(100dvh - 180px))' : 'calc(100vh - 200px)',
          maxHeight: isMobile ? 'calc(100dvh - 180px)' : 600,
          ...glassStyle,
          opacity: shouldShow ? 1 : 0,
          transform: shouldShow
            ? 'scale(1) translate(0, 0)'
            : isMobile
              ? 'scale(0.92) translateY(16px)'
              : 'scale(0.85) translateX(-12px)',
          transformOrigin: isMobile ? 'bottom center' : 'left center',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          pointerEvents: shouldShow ? 'auto' : 'none',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 pb-4 pt-4">
          <h2
            style={{
              color: '#fff',
              fontFamily: 'FuturaDisplay, sans-serif',
              fontSize: 24,
              letterSpacing: '0.01em',
              lineHeight: 1,
            }}
          >
            Photos
          </h2>
          <button
            type="button"
            title="Upload photo"
            aria-label="Upload photo"
            onClick={openFilePicker}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/10 active:scale-90"
          >
            <Image
              src="/assets/tools_icons/frame_icon.png"
              alt=""
              width={24}
              height={24}
              draggable={false}
              className="pointer-events-none select-none opacity-70"
            />
          </button>
        </header>

        <div className="mx-3 h-px bg-white/30" />

        {/* Body */}
        {images.length === 0 ? (
          <EmptyState onUpload={openFilePicker} />
        ) : (
          <>
            <section className="flex-1 overflow-y-auto pt-4 pb-2" style={{ overflowX: 'hidden' }}>
              <div
                style={{
                  width: '90%',
                  margin: '0 auto',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                {/* Upload more tile */}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    title="Upload more"
                    onClick={openFilePicker}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl transition-all duration-150 hover:bg-white/10 active:scale-95"
                    style={{
                      aspectRatio: '1 / 1',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1.5px dashed rgba(255,255,255,0.25)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>+</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-poppins)',
                        fontWeight: 600,
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.4)',
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      Upload more
                    </span>
                  </button>
                )}

                {images.map(image => (
                  <ImageThumbnail
                    key={image.id}
                    image={image}
                    isChecked={selectedIds.has(image.id)}
                    onToggleCheck={(e) => toggleSelect(image.id, e)}
                    onPlace={() => placeImage(image)}
                  />
                ))}
              </div>

              {images.length >= MAX_IMAGES && (
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 10,
                    fontFamily: 'var(--font-poppins)',
                  }}
                >
                  Max 10 photos reached
                </p>
              )}
            </section>

            {/* Delete bar — fixed footer, pill button at 90% width */}
            <div
              style={{
                flexShrink: 0,
                overflow: 'hidden',
                maxHeight: hasSelection ? 80 : 0,
                opacity: hasSelection ? 1 : 0,
                transition: 'max-height 0.25s ease, opacity 0.2s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 14,
                paddingTop: 8,
              }}
            >
              <button
                type="button"
                onClick={deleteSelected}
                className="flex items-center justify-center gap-3 transition-opacity duration-150 hover:opacity-90 active:scale-[0.98]"
                style={{
                  width: '90%',
                  height: 54,
                  background: 'rgba(210, 40, 40, 0.92)',
                  border: 'none',
                  borderRadius: 999,
                  color: '#fff',
                  fontFamily: 'var(--font-poppins)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delete {selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
