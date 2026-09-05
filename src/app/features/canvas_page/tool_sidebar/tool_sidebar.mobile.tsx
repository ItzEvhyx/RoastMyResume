'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useText } from '../context/TextContext';
import { useDivider } from '../context/DividerContext';
import { useIcon } from '../context/IconContext';
import { usePen } from '../context/PenContext';

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

const TOOLS = [
  { id: 'fontstyle', label: 'Text',      src: '/assets/tools_icons/font_style_icon.svg'  },
  { id: 'divider',   label: 'Divider',   src: '/assets/tools_icons/divider_icon.svg'     },
  { id: 'iconset',   label: 'Icon Set',  src: '/assets/tools_icons/iconset_icon.svg'     },
  { id: 'image',     label: 'Image',     src: '/assets/tools_icons/image_upload_icon.svg'},
  { id: 'container', label: 'Container', src: '/assets/tools_icons/container_icon.svg'   },
  { id: 'pen',       label: 'Pen',       src: '/assets/tools_icons/pen_icon.svg'         },
  { id: 'shapes',    label: 'Shapes',    src: '/assets/tools_icons/shapes_icon.svg'      },
  { id: 'layers',    label: 'Layers',    src: '/assets/tools_icons/layer_icon.svg'       },
];

// A4 canvas dimensions — text element is placed at the horizontal center,
// roughly one-quarter down the page so it's visible at default zoom.
const CANVAS_WIDTH = 794;
const CANVAS_HEIGHT = 1123;

export default function ToolSidebarMobile({ stage }: { stage: number }) {
  const {
    addTextElement,
    setSelectedId,
    toolbarExpanded,
    setToolbarExpanded,
    activeTool,
    setActiveTool,
  } = useText();
  const { addDividerElement, setSelectedDividerId } = useDivider();
  const { setSelectedIconId } = useIcon();
  const { setIsPenActive } = usePen();

  useEffect(() => {
    setToolbarExpanded(stage >= 3);
  }, [stage, setToolbarExpanded]);

  const sidebarVisible = stage >= 3;
  const sidebarPopStyle: React.CSSProperties = {
    opacity: sidebarVisible ? 1 : 0,
    transform: sidebarVisible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(12px)',
    transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
  };

  const handleToolTap = (toolId: string) => {
    const nextTool = activeTool === toolId ? null : toolId;
    setActiveTool(nextTool);

    if (toolId === 'fontstyle') {
      // Place new text element at canvas center, slightly above vertical midpoint
      setSelectedDividerId(null);
      setSelectedIconId(null);
      addTextElement(CANVAS_WIDTH / 2 - 75, CANVAS_HEIGHT / 4);
    }

    if (toolId === 'divider') {
      setSelectedId(null);
      setSelectedIconId(null);
      addDividerElement(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 4);
    }

    setIsPenActive(nextTool === 'pen');
    if (nextTool === 'pen') {
      setSelectedId(null);
      setSelectedDividerId(null);
      setSelectedIconId(null);
    }
  };

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4"
      style={sidebarPopStyle}
    >
      <div
        className="pointer-events-auto no-scrollbar flex items-center gap-2 overflow-x-auto rounded-full px-2.5 py-1.5"
        style={{
          ...glassStyle,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => handleToolTap(tool.id)}
            className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
            style={{ opacity: toolbarExpanded && activeTool === tool.id ? 1 : 0.55 }}
          >
            <Image
              src={tool.src}
              alt={tool.label}
              width={36}
              height={36}
              draggable={false}
              className="select-none pointer-events-none"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
