'use client';

import { ColorPicker } from '../../globals/color.picker';

interface PenColorPickerProps {
  color: string;
  onSelect: (color: string) => void;
}

export function PenColorPicker({ color, onSelect }: PenColorPickerProps) {
  return (
    <div className="pen-color-picker-wrapper" style={{ position: 'relative' }}>
      <style>{`
        /* Position color picker popup to the right of pen tools */
        .pen-color-picker-wrapper .color-picker-popup {
          left: calc(100% + 70px) !important;
          top: -20px !important;
          transform: translateX(0) scale(1.2) !important;
          transform-origin: left center !important;
        }
      `}</style>
      <ColorPicker color={color} onSelect={onSelect} />
    </div>
  );
}
