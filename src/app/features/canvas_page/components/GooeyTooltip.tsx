'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Poppins } from 'next/font/google';
import './GooeyTooltip.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-poppins-bold',
});

interface GooeyTooltipProps {
  label: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function GooeyTooltip({ 
  label, 
  children, 
  position = 'right' 
}: GooeyTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateTooltipPosition = () => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 12; // Space between icon and tooltip
    
    // Calculate position based on position prop
    let left = 0;
    let top = 0;
    
    switch (position) {
      case 'right':
        left = rect.right + padding;
        top = rect.top + rect.height / 2;
        break;
      case 'left':
        left = rect.left - padding;
        top = rect.top + rect.height / 2;
        break;
      case 'top':
        left = rect.left + rect.width / 2;
        top = rect.top - padding;
        break;
      case 'bottom':
        left = rect.left + rect.width / 2;
        top = rect.bottom + padding;
        break;
    }
    
    setTooltipPosition({ left, top });
  };

  useEffect(() => {
    if (isHovered) {
      updateTooltipPosition();
    }
  }, [isHovered]);

  const getTransformOrigin = () => {
    switch (position) {
      case 'right':
        return 'left center';
      case 'left':
        return 'right center';
      case 'top':
        return 'center bottom';
      case 'bottom':
        return 'center top';
      default:
        return 'left center';
    }
  };

  const getTransform = () => {
    switch (position) {
      case 'right':
        return 'translateY(-50%)';
      case 'left':
        return 'translate(-100%, -50%)';
      case 'top':
        return 'translate(-50%, -100%)';
      case 'bottom':
        return 'translate(-50%, 0)';
      default:
        return 'translateY(-50%)';
    }
  };

  const tooltipContent = isHovered && mounted && (
    <div 
      ref={pillRef}
      className={`tooltip-pill ${poppins.variable}`}
      style={{
        position: 'fixed',
        left: `${tooltipPosition.left}px`,
        top: `${tooltipPosition.top}px`,
        transform: getTransform(),
        transformOrigin: getTransformOrigin(),
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {label}
    </div>
  );

  return (
    <>
      <div 
        className="tooltip-trigger"
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </div>
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  );
}
