'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const glassStyle: React.CSSProperties = {
  background: 'rgba(30, 32, 38, 0.55)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 24px rgba(0,0,0,0.4)',
};

const TOOLS = [
  { id: 'fontstyle', label: 'Font Style',  src: '/assets/tools_icons/font_style_icon.svg'   },
  { id: 'divider',   label: 'Divider',      src: '/assets/tools_icons/divider_icon.svg'       },
  { id: 'iconset',   label: 'Icon Set',     src: '/assets/tools_icons/iconset_icon.svg'       },
  { id: 'image',     label: 'Image',        src: '/assets/tools_icons/image_upload_icon.svg'  },
  { id: 'container', label: 'Container',    src: '/assets/tools_icons/container_icon.svg'     },
  { id: 'pen',       label: 'Pen',          src: '/assets/tools_icons/pen_icon.svg'           },
  { id: 'shapes',    label: 'Shapes',       src: '/assets/tools_icons/shapes_icon.svg'        },
  { id: 'layers',    label: 'Layers',       src: '/assets/tools_icons/layer_icon.svg'         },
];

export default function ToolSidebarMobile({ stage }: { stage: number }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const sidebarVisible = stage >= 3;
  const sidebarPopStyle: React.CSSProperties = {
    opacity: sidebarVisible ? 1 : 0,
    transform: sidebarVisible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(12px)',
    transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
  };

  return (
    <div 
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4"
      style={sidebarPopStyle}
    >
      {/* Horizontal scrollable toolbar */}
      <div 
        className="pointer-events-auto no-scrollbar flex items-center gap-2 overflow-x-auto rounded-full px-2.5 py-2"
        style={{
          ...glassStyle,
          maxWidth: 'calc(100vw - 32px)', // leave 16px padding on each side
        }}
      >
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => setActiveTool(t => t === tool.id ? null : tool.id)}
            className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
            style={{ opacity: activeTool === tool.id ? 1 : 0.55 }}
          >
            <Image src={tool.src} alt={tool.label} width={44} height={44} />
          </button>
        ))}
      </div>
    </div>
  );
}
