'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { useText } from '../context/TextContext';
import { useDivider } from '../context/DividerContext';
import { usePen } from '../context/PenContext';
import GooeyTooltip from '../components/GooeyTooltip';

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

const TOOLS = [
  { id: 'fontstyle', label: 'Text', src: '/assets/tools_icons/font_style_icon.svg' },
  { id: 'divider', label: 'Divider', src: '/assets/tools_icons/divider_icon.svg' },
  { id: 'iconset', label: 'Icon Set', src: '/assets/tools_icons/iconset_icon.svg' },
  { id: 'image', label: 'Image Upload', src: '/assets/tools_icons/image_upload_icon.svg' },
  { id: 'container', label: 'Container', src: '/assets/tools_icons/container_icon.svg' },
  { id: 'pen', label: 'Pen', src: '/assets/tools_icons/pen_icon.svg' },
  { id: 'shapes', label: 'Shapes', src: '/assets/tools_icons/shapes_icon.svg' },
];

function ToolButton({
  label, src, active, onClick, onDragStart,
}: {
  label: string; src: string; active: boolean; onClick: () => void; onDragStart?: (e: React.DragEvent) => void;
}) {
  return (
    <GooeyTooltip label={label} position="right">
      <button
        onClick={onClick}
        onDragStart={onDragStart}
        draggable={!!onDragStart}
        className="group relative flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
        style={{ opacity: active ? 1 : 0.55, cursor: onDragStart ? 'grab' : 'pointer' }}
      >
        <Image src={src} alt={label} width={42} height={42} draggable={false} className="select-none pointer-events-none" />
      </button>
    </GooeyTooltip>
  );
}

export default function ToolSidebarWeb({ stage }: { stage: number }) {
  const [expanded, setExpanded] = useState(false);
  const { addTextElement, setToolbarExpanded, activeTool, setActiveTool, setSelectedId } = useText();
  const { addDividerElement, setSelectedDividerId } = useDivider();
  const { setIsPenActive } = usePen();

  // Auto-expand once stage 4 is reached
  useEffect(() => {
    if (stage >= 4) setExpanded(true);
  }, [stage]);

  // Sync expanded state to context
  useEffect(() => {
    setToolbarExpanded(expanded);
  }, [expanded, setToolbarExpanded]);

  const handleToolClick = (toolId: string) => {
    const newTool = activeTool === toolId ? null : toolId;
    setActiveTool(newTool);

    // Deselect text when switching away from text tool
    if (activeTool === 'fontstyle' && toolId !== 'fontstyle') {
      setSelectedId(null);
    }

    // Deselect divider when switching away from divider tool
    if (activeTool === 'divider' && toolId !== 'divider') {
      setSelectedDividerId(null);
    }

    // Add text to center of canvas when text tool is clicked
    if (toolId === 'fontstyle') {
      setSelectedDividerId(null); // only one kind of element selected at a time
      addTextElement(300, 300); // Center-ish position
    }

    // Add a horizontal divider line to the canvas when the divider tool is clicked
    if (toolId === 'divider') {
      setSelectedId(null); // only one kind of element selected at a time
      addDividerElement(300, 300);
    }

    // Activate pen tool
    if (toolId === 'pen') {
      setIsPenActive(true);
      setSelectedId(null);
      setSelectedDividerId(null);
    } else {
      setIsPenActive(false);
    }
  };

  const handleTextDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('tool', 'text');
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDividerDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('tool', 'divider');
    e.dataTransfer.effectAllowed = 'copy';
  };

  const sidebarVisible = stage >= 3;
  const sidebarPopStyle: React.CSSProperties = {
    opacity: sidebarVisible ? 1 : 0,
    transform: sidebarVisible ? 'scale(1) translateX(0)' : 'scale(0.85) translateX(-12px)',
    transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
  };

  return (
    <div className="pointer-events-none fixed left-6 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-4"
      style={{ ...sidebarPopStyle, marginTop: '40px' }} // Push down 40px
    >
      {/* Main tools pill */}
      <div className="pointer-events-auto flex flex-col items-center rounded-full py-3" style={glassStyle}>

        {/* Chevron toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-white/60 transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-90"
        >
          {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>

        {/* Tools */}
        <div
          className="flex flex-col items-center overflow-hidden transition-all duration-700 ease-out"
          style={{ maxHeight: expanded ? TOOLS.length * 78 : 0 }}
        >
          <div className="my-1.5 h-px w-8 bg-white/15" />
          {TOOLS.map(tool => (
            <ToolButton
              key={tool.id}
              label={tool.label}
              src={tool.src}
              active={activeTool === tool.id}
              onClick={() => handleToolClick(tool.id)}
              onDragStart={
                tool.id === 'fontstyle' ? handleTextDragStart :
                  tool.id === 'divider' ? handleDividerDragStart :
                    undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Layers pill */}
      <div className="pointer-events-auto flex flex-col items-center rounded-full py-3" style={glassStyle}>
        <GooeyTooltip label="Layers" position="right">
          <button
            onClick={() => setActiveTool(activeTool === 'layers' ? null : 'layers')}
            className="group relative flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
            style={{ opacity: activeTool === 'layers' ? 1 : 0.55 }}
          >
            <Image src="/assets/tools_icons/layer_icon.svg" alt="Layers" width={42} height={42} draggable={false} className="select-none pointer-events-none" />
          </button>
        </GooeyTooltip>
      </div>

      {/* Zoom controls - compact pill below layers */}
      <ZoomControls />

    </div>
  );
}

// Compact zoom controls below the sidebar
function ZoomControls() {
  const { zoom, setZoom, resetView } = useCanvas();
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.05;

  return (
    <div
      className="pointer-events-auto flex flex-col items-center gap-0.5 rounded-full px-2.5 py-2"
      style={{
        background: 'rgba(30, 32, 38, 0.55)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <GooeyTooltip label="Zoom In" position="right">
        <button
          onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full text-xl text-white/80 transition-all hover:bg-white/10 active:scale-90"
        >
          +
        </button>
      </GooeyTooltip>
      <GooeyTooltip label="Zoom Out" position="right">
        <button
          onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full text-xl text-white/80 transition-all hover:bg-white/10 active:scale-90"
        >
          −
        </button>
      </GooeyTooltip>
      <div className="my-0.5 h-px w-6 bg-white/15" />
      <GooeyTooltip label="Reset View" position="right">
        <button
          onClick={resetView}
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/10 active:scale-90"
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2L8 8L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </GooeyTooltip>
    </div>
  );
}