'use client';

/**
 * GroupContext
 *
 * Stores committed groups on the canvas.  A group is a bounding-box wrapper
 * that:
 *   - Tracks the canvas position / dimensions of the wrapper itself (x, y, w, h)
 *   - Remembers the original bounding box at group-creation time so that
 *     when the user resizes the wrapper we can proportionally reposition every
 *     member element on ungroup.
 *   - Stores full snapshots of member elements so ungroup can restore them
 *     exactly (at their scaled positions) without needing to reach into the
 *     individual element contexts.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useUndo } from '../globals/undo';
import type { TextElement } from './TextContext';
import type { DividerElement } from './DividerContext';
import type { IconElement } from './IconContext';
import type { PenStroke } from './PenContext';
import { clampGroupToSafeArea } from '../canvas/safe.area';
import { useLayerOrder } from '../globals/layer.order';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Full snapshots of every member at the moment the group was committed. */
export interface GroupMembers {
  texts: TextElement[];
  dividers: DividerElement[];
  icons: IconElement[];
  strokes: PenStroke[];
}

/**
 * The live bounding-box group element rendered on the canvas.
 *
 * x / y / width / height  — current wrapper position + size (canvas px).
 * originX / originY /
 * originWidth / originHeight — the bounding box at the moment of grouping,
 *   used to compute the scale factor when the user resizes before ungrouping.
 * members — full snapshots taken at group-creation time.
 */
export interface GroupElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
  members: GroupMembers;
  zIndex?: number;
  isLocked?: boolean;
}

interface GroupContextType {
  groupElements: GroupElement[];
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  addGroup: (bbox: { x: number; y: number; width: number; height: number }, members: GroupMembers) => string;
  /** Replace all groups (persistence). Does not record undo. */
  hydrateGroupElements: (elements: GroupElement[]) => void;
  updateGroup: (id: string, updates: Partial<Pick<GroupElement, 'x' | 'y' | 'width' | 'height' | 'originWidth' | 'originHeight' | 'zIndex' | 'isLocked'>>) => void;
  startUpdateBatch: () => void;
  endUpdateBatch: () => void;
  deleteGroup: (id: string) => void;
  /**
   * Ungroup: removes the group element and returns the member snapshots
   * repositioned + rescaled to the current wrapper geometry.
   * The caller (canvas.web.tsx) is responsible for re-adding those elements
   * to their respective contexts.
   */
  ungroup: (id: string) => GroupMembers | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const GroupContext = createContext<GroupContextType | undefined>(undefined);

// ─── Scale helpers ────────────────────────────────────────────────────────────

function scaleMembers(group: GroupElement): GroupMembers {
  const scaleX = group.width / group.originWidth;
  const scaleY = group.height / group.originHeight;
  const dx = group.x - group.originX;
  const dy = group.y - group.originY;

  const texts: TextElement[] = group.members.texts.map(t => ({
    ...t,
    x: group.originX + (t.x - group.originX) * scaleX + dx,
    y: group.originY + (t.y - group.originY) * scaleY + dy,
    width: t.width * scaleX,
    fontSize: Math.max(6, Math.round(t.fontSize * Math.min(scaleX, scaleY))),
  }));

  const dividers: DividerElement[] = group.members.dividers.map(d => ({
    ...d,
    x: group.originX + (d.x - group.originX) * scaleX + dx,
    y: group.originY + (d.y - group.originY) * scaleY + dy,
    width: d.width * scaleX,
    thickness: Math.max(1, Math.round((d.thickness ?? 2) * scaleY)),
  }));

  const icons: IconElement[] = group.members.icons.map(ic => ({
    ...ic,
    x: group.originX + (ic.x - group.originX) * scaleX + dx,
    y: group.originY + (ic.y - group.originY) * scaleY + dy,
    width: (ic.width ?? ic.size) * scaleX,
    height: (ic.height ?? ic.size) * scaleY,
    size: Math.round(ic.size * Math.min(scaleX, scaleY)),
  }));

  const strokes: PenStroke[] = group.members.strokes.map(stroke => ({
    ...stroke,
    x: group.originX + (stroke.x - group.originX) * scaleX + dx,
    y: group.originY + (stroke.y - group.originY) * scaleY + dy,
    width: stroke.width * scaleX,
    height: stroke.height * scaleY,
  }));

  return { texts, dividers, icons, strokes };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GroupProvider({ children }: { children: ReactNode }) {
  const [groupElements, setGroupElements] = useState<GroupElement[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { record, startBatch, endBatch } = useUndo();
  const { getNextLayer } = useLayerOrder();

  const addGroup = useCallback(
    (bbox: { x: number; y: number; width: number; height: number }, members: GroupMembers): string => {
      const safeBounds = clampGroupToSafeArea(bbox, {});
      const el: GroupElement = {
        id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: safeBounds.updates.x!,
        y: safeBounds.updates.y!,
        width: safeBounds.updates.width!,
        height: safeBounds.updates.height!,
        originX: bbox.x,
        originY: bbox.y,
        originWidth: bbox.width,
        originHeight: bbox.height,
        members,
        zIndex: getNextLayer(),
      };
      setGroupElements(prev => [...prev, el]);
      setSelectedGroupId(el.id);
      record(
        () => {
          setGroupElements(prev => prev.filter(g => g.id !== el.id));
          setSelectedGroupId(cur => (cur === el.id ? null : cur));
        },
        () => {
          setGroupElements(prev => [...prev, el]);
          setSelectedGroupId(el.id);
        },
      );
      return el.id;
    },
    [getNextLayer, record],
  );

  const hydrateGroupElements = useCallback((elements: GroupElement[]) => {
    setGroupElements(elements);
    setSelectedGroupId(null);
  }, []);

  const updateGroup = useCallback(
    (id: string, updates: Partial<Pick<GroupElement, 'x' | 'y' | 'width' | 'height' | 'originWidth' | 'originHeight' | 'zIndex' | 'isLocked'>>) => {
      setGroupElements(prev =>
        prev.map(g => (g.id === id ? { ...g, ...updates } : g)),
      );
    },
    [],
  );

  const startUpdateBatch = useCallback(() => startBatch(), [startBatch]);
  const endUpdateBatch = useCallback(() => endBatch(), [endBatch]);

  const deleteGroup = useCallback(
    (id: string) => {
      const idx = groupElements.findIndex(g => g.id === id);
      const deleted = groupElements[idx];
      if (!deleted) return;
      const prevSel = selectedGroupId;
      record(
        () => {
          setGroupElements(els => [...els.slice(0, idx), deleted, ...els.slice(idx)]);
          setSelectedGroupId(prevSel);
        },
        () => {
          setGroupElements(els => els.filter(g => g.id !== id));
          setSelectedGroupId(cur => (cur === id ? null : cur));
        },
      );
      setGroupElements(els => els.filter(g => g.id !== id));
      setSelectedGroupId(cur => (cur === id ? null : cur));
    },
    [groupElements, selectedGroupId, record],
  );

  const ungroup = useCallback(
    (id: string): GroupMembers | null => {
      const group = groupElements.find(g => g.id === id);
      if (!group) return null;
      const scaled = scaleMembers(group);
      // Remove the group element — the caller will re-add the scaled members.
      const idx = groupElements.findIndex(g => g.id === id);
      const prevSel = selectedGroupId;
      record(
        () => {
          setGroupElements(els => [...els.slice(0, idx), group, ...els.slice(idx)]);
          setSelectedGroupId(prevSel);
        },
        () => {
          setGroupElements(els => els.filter(g => g.id !== id));
          setSelectedGroupId(cur => (cur === id ? null : cur));
        },
      );
      setGroupElements(els => els.filter(g => g.id !== id));
      setSelectedGroupId(null);
      return scaled;
    },
    [groupElements, selectedGroupId, record],
  );

  return (
    <GroupContext.Provider
      value={{
        groupElements,
        selectedGroupId,
        setSelectedGroupId,
        addGroup,
        hydrateGroupElements,
        updateGroup,
        startUpdateBatch,
        endUpdateBatch,
        deleteGroup,
        ungroup,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within a GroupProvider');
  return ctx;
}
