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
  { id: 'fontstyle', label: 'Font Style',    src: '/assets/tools_icons/font_style_icon.svg'    },
  { id: 'divider',   label: 'Divider',        src: '/assets/tools_icons/divider_icon.svg'        },
  { id: 'iconset',   label: 'Icon Set',       src: '/assets/tools_icons/iconset_icon.svg'        },
  { id: 'image',     label: 'Image Upload',   src: '/assets/tools_icons/image_upload_icon.svg'   },
  { id: 'container', label: 'Container',      src: '/assets/tools_icons/container_icon.svg'      },
  { id: 'pen',       label: 'Pen',            src: '/assets/tools_icons/pen_icon.svg'            },
  { id: 'shapes',    label: 'Shapes',         src: '/assets/tools_icons/shapes_icon.svg'         },
];

function ToolButton({
  label, src, active, onClick,
}: {
  label: string; src: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="group relative flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
      style={{ opacity: active ? 1 : 0.55 }}
    >
      <Image src={src} alt={label} width={42} height={42} />
      <span
        className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{ fontFamily: 'sans-serif' }}
      >
        {label}
      </span>
    </button>
  );
}

export default function ToolSidebarWeb() {
  const [expanded, setExpanded] = useState(true);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="pointer-events-none fixed left-6 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-4">

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
          className="flex flex-col items-center overflow-hidden transition-all duration-300 ease-out"
          style={{ maxHeight: expanded ? TOOLS.length * 78 : 0 }}
        >
          <div className="my-1.5 h-px w-8 bg-white/15" />
          {TOOLS.map(tool => (
            <ToolButton
              key={tool.id}
              label={tool.label}
              src={tool.src}
              active={activeTool === tool.id}
              onClick={() => setActiveTool(t => t === tool.id ? null : tool.id)}
            />
          ))}
        </div>
      </div>

      {/* Layers pill */}
      <div className="pointer-events-auto flex flex-col items-center rounded-full py-3" style={glassStyle}>
        <button
          title="Layers"
          onClick={() => setActiveTool(t => t === 'layers' ? null : 'layers')}
          className="group relative flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-150 hover:bg-white/10 active:scale-90"
          style={{ opacity: activeTool === 'layers' ? 1 : 0.55 }}
        >
          <Image src="/assets/tools_icons/layer_icon.svg" alt="Layers" width={42} height={42} />
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            Layers
          </span>
        </button>
      </div>

    </div>
  );
}
