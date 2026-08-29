'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
];

export default function ToolSidebarMobile() {
  const [expanded, setExpanded] = useState(true);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="pointer-events-none fixed left-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-3">

      {/* Main tools pill */}
      <div className="pointer-events-auto flex flex-col items-center rounded-full py-2.5" style={glassStyle}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full text-white/60 transition-all duration-150 hover:bg-white/10 active:scale-90"
        >
          {expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
        </button>

        <div
          className="flex flex-col items-center overflow-hidden transition-all duration-300 ease-out"
          style={{ maxHeight: expanded ? TOOLS.length * 70 : 0 }}
        >
          <div className="my-1.5 h-px w-7 bg-white/15" />
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              title={tool.label}
              onClick={() => setActiveTool(t => t === tool.id ? null : tool.id)}
              className="flex h-[54px] w-[54px] items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
              style={{ opacity: activeTool === tool.id ? 1 : 0.55 }}
            >
              <Image src={tool.src} alt={tool.label} width={36} height={36} />
            </button>
          ))}
        </div>
      </div>

      {/* Layers pill */}
      <div className="pointer-events-auto flex flex-col items-center rounded-full py-2.5" style={glassStyle}>
        <button
          title="Layers"
          onClick={() => setActiveTool(t => t === 'layers' ? null : 'layers')}
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
          style={{ opacity: activeTool === 'layers' ? 1 : 0.55 }}
        >
          <Image src="/assets/tools_icons/layer_icon.svg" alt="Layers" width={36} height={36} />
        </button>
      </div>

    </div>
  );
}
