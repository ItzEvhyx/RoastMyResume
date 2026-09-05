'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { useText } from '../context/TextContext';
import { useDivider } from '../context/DividerContext';
import { useIcon } from '../context/IconContext';
import { useClipboard } from '../globals/pasting';
import { DraggableText, DraggableDivider, DraggableIcon } from '../globals/drag.elements';
import { clampDividerToSafeArea, clampTextToSafeArea, clampIconToSafeArea, getTextHeight, SafeAreaWarning } from './safe.area';
import { PenCanvas } from '../tool_sidebar/pen/pen.canvas';
import { LassoCanvas } from '../tool_sidebar/container/container.tools';
import { SelectionBoundary } from '../tool_sidebar/container/container.group';
import { DraggableGroup } from '../globals/group.element';
import { useGroup } from '../context/GroupContext';
import { RulerGuides, useRulerSnapping } from '../globals/ruler.snapping';
import type { DividerElement } from '../context/DividerContext';
import type { TextElement } from '../context/TextContext';
import type { IconElement } from '../context/IconContext';

/**
 * A4 Resume dimensions:
 * - Physical A4: 210mm × 297mm (21.0cm × 29.7cm)
 * - At 96 DPI: 794px × 1123px
 * - At 300 DPI (export): 2480px × 3508px
 * 
 * We use 210mm × 297mm ratio = 0.707 (width/height)
 * To get cleaner numbers: 794 × 1123 maintains this ratio
 */
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;

interface EdgeWarning {
  x: number;
  y: number;
  height: number;
}

export default function CanvasWeb() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const { zoom, setZoom, pan, setPan, isGrabMode } = useCanvas();
  const { textElements, selectedId, setSelectedId, updateElement, deleteElement, addTextElement, addFullTextElement } = useText();
  const { dividerElements, selectedDividerId, setSelectedDividerId, addDividerElement, updateDivider, deleteDivider } = useDivider();
  const { iconElements, selectedIconId, setSelectedIconId, updateIcon, deleteIcon, addFullIconElement } = useIcon();
  const {
    groupElements, selectedGroupId, setSelectedGroupId,
    deleteGroup, ungroup,
  } = useGroup();
  const { register, unregister } = useClipboard();
  const { setElements: setRulerElements } = useRulerSnapping();
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [edgeWarning, setEdgeWarning] = useState<EdgeWarning | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showEdgeWarning = useCallback((warning: EdgeWarning) => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    setEdgeWarning(warning);
  }, []);

  const clearEdgeWarning = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    setEdgeWarning(null);
  }, []);

  useEffect(() => () => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  useEffect(() => {
    setRulerElements([
      ...textElements.map(element => ({ id: element.id, x: element.x, y: element.y, width: element.width, height: getTextHeight(element) })),
      ...dividerElements.map(element => ({ id: element.id, x: element.x, y: element.y, width: element.width, height: element.thickness ?? 2 })),
      ...iconElements.map(element => ({ id: element.id, x: element.x, y: element.y, width: element.width ?? element.size, height: element.height ?? element.size })),
    ]);
  }, [textElements, dividerElements, iconElements, setRulerElements]);

  const updateTextSafely = (element: TextElement, updates: Partial<TextElement>) => {
    const result = clampTextToSafeArea(element, updates);
    updateElement(element.id, result.updates);
    if (result.wasClamped) {
      const next = { ...element, ...result.updates };
      showEdgeWarning({ x: next.x, y: next.y, height: getTextHeight(next) });
    } else {
      clearEdgeWarning();
    }
  };

  const updateDividerSafely = (element: DividerElement, updates: Partial<DividerElement>) => {
    const result = clampDividerToSafeArea(element, updates);
    updateDivider(element.id, result.updates);
    if (result.wasClamped) {
      const next = { ...element, ...result.updates };
      showEdgeWarning({ x: next.x, y: next.y, height: next.thickness ?? 2 });
    } else {
      clearEdgeWarning();
    }
  };

  const updateIconSafely = (element: IconElement, updates: Partial<IconElement>) => {
    const result = clampIconToSafeArea(element, updates);
    updateIcon(element.id, result.updates);
    if (result.wasClamped) {
      const next = { ...element, ...result.updates };
      showEdgeWarning({ x: next.x, y: next.y, height: next.size });
    } else {
      clearEdgeWarning();
    }
  };

  // Register text clipboard source — copies all styling properties
  useEffect(() => {
    register('text', {
      getCurrent: () => {
        if (!selectedId) return null;
        const el = textElements.find(e => e.id === selectedId);
        if (!el) return null;
        return { type: 'text', data: { ...el } };
      },
      paste: (entry, dx, dy) => {
        const src = entry.data as Record<string, unknown>;
        addFullTextElement({
          content: (src.content as string) ?? 'Add text',
          x: ((src.x as number) ?? 100) + dx,
          y: ((src.y as number) ?? 100) + dy,
          width: (src.width as number) ?? 150,
          fontSize: (src.fontSize as number) ?? 24,
          fontFamily: (src.fontFamily as string) ?? 'Arial, sans-serif',
          color: (src.color as string) ?? '#000000',
          fontWeight: src.fontWeight as number | undefined,
          fontStyle: src.fontStyle as 'normal' | 'italic' | undefined,
          textDecoration: src.textDecoration as 'none' | 'underline' | undefined,
          listType: src.listType as 'none' | 'bullet' | 'number' | undefined,
          textAlign: src.textAlign as 'none' | 'left' | 'right' | 'center' | 'justify' | undefined,
          textCategory: src.textCategory as 'header' | 'subheader' | 'body' | 'meta' | null | undefined,
        });
      },
    });
    return () => unregister('text');
  }, [selectedId, textElements, register, unregister, addFullTextElement]);

  // Register dividers so they participate in the global copy/paste workflow.
  useEffect(() => {
    register('divider', {
      getCurrent: () => {
        if (!selectedDividerId) return null;
        const element = dividerElements.find(item => item.id === selectedDividerId);
        return element ? { type: 'divider', data: { ...element } } : null;
      },
      paste: (entry, dx, dy) => {
        const src = entry.data as Record<string, unknown>;
        const width = (src.width as number) ?? 300;
        const id = addDividerElement(((src.x as number) ?? 100) + dx, ((src.y as number) ?? 100) + dy, width);
        updateDivider(id, {
          thickness: src.thickness as number | undefined,
          color: src.color as string | undefined,
        });
      },
    });
    return () => unregister('divider');
  }, [selectedDividerId, dividerElements, register, unregister, addDividerElement, updateDivider]);

  // Register icons for the global copy/paste workflow.
  useEffect(() => {
    register('icon', {
      getCurrent: () => {
        if (!selectedIconId) return null;
        const el = iconElements.find(e => e.id === selectedIconId);
        return el ? { type: 'icon', data: { ...el } } : null;
      },
      paste: (entry, dx, dy) => {
        const src = entry.data as IconElement;
        addFullIconElement({
          x: (src.x ?? 100) + dx,
          y: (src.y ?? 100) + dy,
          size: src.size ?? 48,
          width: src.width,
          height: src.height,
          isShape: src.isShape,
          shapeKind: src.shapeKind,
          borderWidth: src.borderWidth,
          borderColor: src.borderColor,
          cornerRadius: src.cornerRadius,
          isFrame: src.isFrame,
          frameImage: src.frameImage,
          svgUrl: src.svgUrl ?? '',
          color: src.color ?? '#000000',
          flip: src.flip,
        });
      },
    });
    return () => unregister('icon');
  }, [selectedIconId, iconElements, register, unregister, addFullIconElement]);

  // Handle drop on canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tool = e.dataTransfer.getData('tool');

    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    // The rect reflects pan and zoom; scale the screen release point back into
    // the canvas's untransformed coordinate system before placing the tool.
    const x = ((e.clientX - canvasRect.left) / canvasRect.width) * PAGE_WIDTH;
    const y = ((e.clientY - canvasRect.top) / canvasRect.height) * PAGE_HEIGHT;

    if (tool === 'text') {
      const draft: TextElement = { id: '', content: 'Add text', x, y, width: 150, fontSize: 24 };
      const result = clampTextToSafeArea(draft, {});
      addTextElement(result.updates.x!, result.updates.y!, 'Add text', result.updates.width);
      if (result.wasClamped) showEdgeWarning({ x: result.updates.x!, y: result.updates.y!, height: getTextHeight({ ...draft, ...result.updates }) });
    }

    if (tool === 'divider') {
      // Center the divider horizontally on the drop point, same as clicking the tool does visually
      const draft: DividerElement = { id: '', x: x - 150, y, width: 300, thickness: 2 };
      const result = clampDividerToSafeArea(draft, {});
      addDividerElement(result.updates.x!, result.updates.y!, result.updates.width);
      if (result.wasClamped) showEdgeWarning({ x: result.updates.x!, y: result.updates.y!, height: 2 });
    }

    const shapeKind = e.dataTransfer.getData('shape-kind');
    if (tool === 'shape' && (shapeKind === 'square' || shapeKind === 'circle')) {
      const size = 110;
      // Drop the centre of the new shape where the pointer is released, then
      // constrain its actual bounds to the canvas safe area.
      const draft: IconElement = {
        id: '',
        x: x - size / 2,
        y: y - size / 2,
        size,
        width: size,
        height: size,
        isShape: true,
        shapeKind,
        cornerRadius: shapeKind === 'circle' ? undefined : 0,
        svgUrl: shapeKind === 'circle'
          ? '/assets/tools_icons/circle_shape.svg'
          : '/assets/tools_icons/square_shape.svg',
        color: '#000000',
      };
      const result = clampIconToSafeArea(draft, {});
      addFullIconElement({ ...draft, ...result.updates });
      if (result.wasClamped) {
        showEdgeWarning({
          x: result.updates.x ?? draft.x,
          y: result.updates.y ?? draft.y,
          height: size,
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Pan with mouse drag (only in grab mode)
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only pan if grab mode is enabled
      if (!isGrabMode) return;
      if (e.button === 0 || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !isGrabMode) return;
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    viewport.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      viewport.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, pan, isGrabMode, setPan]);

  // Zoom with pinch gesture only (not mouse wheel)
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let lastTouchDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default pinch zoom

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (lastTouchDistance > 0) {
          const delta = (currentDistance - lastTouchDistance) * 0.01;
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
          setZoom(newZoom);
        }

        lastTouchDistance = currentDistance;
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistance = 0;
    };

    viewport.addEventListener('touchstart', handleTouchStart);
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);

    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoom, setZoom]);

  // Global clipboard paste on canvas
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return; // Let textarea handle it normally
      }

      const text = e.clipboardData?.getData('text');
      if (!text || text.trim() === '') return;

      e.preventDefault();

      const lines = text.split('\n');
      const maxLen = Math.max(...lines.map(l => l.length));
      const estimatedWidth = Math.min(650, Math.max(200, Math.round(maxLen * 14)));

      if (selectedId) {
        updateElement(selectedId, {
          content: text,
          width: Math.max(150, estimatedWidth),
        });
      } else {
        addTextElement(
          PAGE_WIDTH / 2 - Math.min(estimatedWidth, 400) / 2,
          PAGE_HEIGHT / 3,
          text,
          estimatedWidth
        );
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedId, updateElement, addTextElement]);

  // Deselect all element types when clicking empty space
  const deselectAll = () => {
    setSelectedId(null);
    setSelectedDividerId(null);
    setSelectedIconId(null);
    setSelectedGroupId(null);
  };

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 overflow-auto no-scrollbar"
      style={{
        cursor: isGrabMode ? (isPanning ? 'grabbing' : 'grab') : 'default',
      }}
      onClick={(e) => {
        // Deselect when clicking outside canvas
        if (e.target === e.currentTarget) {
          deselectAll();
        }
      }}
    >
      {/* Large container to enable scrolling when zoomed */}
      <div
        style={{
          minHeight: '100%',
          minWidth: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => {
          // Deselect when clicking the background
          if (e.target === e.currentTarget) {
            deselectAll();
          }
        }}
      >
        {/* Pannable and zoomable container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            willChange: 'transform',
          }}
        >
          {/* Canvas at current zoom */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            <div
              ref={canvasRef}
              id="resume-canvas"
              data-canvas-area="true"
              style={{
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                position: 'relative',
                backgroundColor: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => {
                // Deselect when clicking canvas background
                if (e.target === e.currentTarget) {
                  deselectAll();
                }
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Pen drawing layer */}
              <PenCanvas />

              {/* Lasso selection layer — sits above elements when active */}
              <LassoCanvas />
              {/* Selection boundary highlights — sibling SVG, same coordinate space */}
              <svg
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: PAGE_WIDTH,
                  height: PAGE_HEIGHT,
                  overflow: 'visible',
                  pointerEvents: 'none',
                  zIndex: 200001,
                }}
              >
                <SelectionBoundary />
              </svg>
              <RulerGuides />
              
              {edgeWarning && <SafeAreaWarning x={edgeWarning.x} y={edgeWarning.y} height={edgeWarning.height} />}
              {/* Render text elements */}
              {textElements.map(element => (
                <DraggableText
                  key={element.id}
                  element={element}
                  isSelected={selectedId === element.id}
                  onSelect={() => {
                    setSelectedDividerId(null);
                    setSelectedIconId(null);
                    setSelectedId(element.id);
                  }}
                  onUpdate={(updates) => updateTextSafely(element, updates)}
                  onDelete={() => deleteElement(element.id)}
                  onDragEnd={clearEdgeWarning}
                />
              ))}

              {/* Render divider elements */}
              {dividerElements.map(element => (
                <DraggableDivider
                  key={element.id}
                  element={element}
                  isSelected={selectedDividerId === element.id}
                  onSelect={() => {
                    setSelectedId(null);
                    setSelectedDividerId(element.id);
                    setSelectedIconId(null);
                  }}
                  onUpdate={(updates) => updateDividerSafely(element, updates)}
                  onDelete={() => deleteDivider(element.id)}
                  onDragEnd={clearEdgeWarning}
                />
              ))}

              {/* Render icon elements */}
              {iconElements.map(element => (
                <DraggableIcon
                  key={element.id}
                  element={element}
                  isSelected={selectedIconId === element.id}
                  onSelect={() => {
                    setSelectedId(null);
                    setSelectedDividerId(null);
                    setSelectedIconId(element.id);
                  }}
                  onUpdate={(updates) => updateIconSafely(element, updates)}
                  onDelete={() => deleteIcon(element.id)}
                  onDragEnd={clearEdgeWarning}
                />
              ))}
              {/* Render group elements */}
              {groupElements.map(group => (
                <DraggableGroup
                  key={group.id}
                  group={group}
                  isSelected={selectedGroupId === group.id}
                  onSelect={() => {
                    setSelectedId(null);
                    setSelectedDividerId(null);
                    setSelectedIconId(null);
                    setSelectedGroupId(group.id);
                  }}
                  onUngroup={() => {
                    const members = ungroup(group.id);
                    if (!members) return;
                    // Re-add all scaled member elements back to their contexts
                    members.texts.forEach(t => addFullTextElement({
                      content: t.content,
                      x: t.x, y: t.y, width: t.width, fontSize: t.fontSize,
                      fontFamily: t.fontFamily, color: t.color,
                      fontWeight: t.fontWeight, fontStyle: t.fontStyle,
                      textDecoration: t.textDecoration, listType: t.listType,
                      textAlign: t.textAlign, textCategory: t.textCategory,
                    }));
                    members.dividers.forEach(d => {
                      const id = addDividerElement(d.x, d.y, d.width);
                      updateDivider(id, { thickness: d.thickness, color: d.color });
                    });
                    members.icons.forEach(ic => addFullIconElement({
                      x: ic.x, y: ic.y, size: ic.size, width: ic.width, height: ic.height,
                      svgUrl: ic.svgUrl, color: ic.color, isShape: ic.isShape,
                      shapeKind: ic.shapeKind, cornerRadius: ic.cornerRadius,
                      isFrame: ic.isFrame, frameImage: ic.frameImage,
                      borderWidth: ic.borderWidth, borderColor: ic.borderColor,
                      flip: ic.flip,
                    }));
                  }}
                  onDelete={() => deleteGroup(group.id)}
                  onSafeAreaClamp={(bounds) => showEdgeWarning({ x: bounds.x, y: bounds.y, height: bounds.height })}
                  onSafeAreaClear={clearEdgeWarning}
                  onTransformEnd={clearEdgeWarning}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
