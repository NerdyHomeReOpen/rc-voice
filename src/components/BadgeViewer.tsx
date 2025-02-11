import React, { useState, useRef } from 'react';
import type { Badge } from '@/types';

const failedImageCache = new Set<string>();

// BadgeImage Component
const BadgeImage: React.FC<Badge> = React.memo((badge) => {
  const getInitialColor = () => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index =
      Math.abs(
        badge.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
      ) % colors.length;
    return colors[index];
  };

  const getDisplayText = () => {
    const name = badge.name || badge.id;
    return name.slice(0, 1).toUpperCase();
  };

  const [showFallBack, setShowFallBack] = useState(false);

  const badgeUrl = `/badge/${badge.id.trim()}.png`;

  if (failedImageCache.has(badgeUrl) || showFallBack) {
    return (
      // Fallback Badge
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium text-white ${getInitialColor()}`}
      >
        {getDisplayText()}
      </div>
    );
  }
  return (
    <img
      src={badgeUrl}
      alt={`${badge.name} Badge`}
      className="select-none w-4 h-4 rounded-full"
      onError={() => {
        failedImageCache.add(badgeUrl);
        setShowFallBack(true);
      }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
});

BadgeImage.displayName = 'BadgeImage';

interface TooltipProps {
  badge: Badge;
  position: { top: number; left: number; placement: 'top' | 'bottom' };
}

const Tooltip: React.FC<TooltipProps> = React.memo(({ badge, position }) => {
  const tooltipContent = (
    <>
      <div className="flex flex-row items-center justify-center space-x-2">
        <BadgeImage {...badge} />
        <div className="font-medium text-center">{badge.name}</div>
      </div>
      <div className="text-xs text-center text-gray-400 mt-1">
        {badge.description}
      </div>
    </>
  );

  const arrowClass =
    position.placement === 'top'
      ? 'top-full border-t-gray-800'
      : 'bottom-full border-b-gray-800';

  return (
    <div
      className="fixed z-50 w-36 px-2 py-1 text-sm bg-gray-800 text-white rounded-md shadow-lg pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div
        className={`absolute -translate-x-1/2 left-1/2 border-4 border-transparent ${arrowClass}`}
      />
      {tooltipContent}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

interface BadgeContainerProps {
  badge: Badge;
  onMouseEnter: (rect: DOMRect) => void;
  onMouseLeave: () => void;
  showTooltip: boolean;
}

const BadgeContainer: React.FC<BadgeContainerProps> = React.memo(
  ({ badge, onMouseEnter, onMouseLeave, showTooltip }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      if (containerRef.current) {
        onMouseEnter(containerRef.current.getBoundingClientRect());
      }
    };

    return (
      <div
        ref={containerRef}
        className="relative inline-block select-none"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <BadgeImage {...badge} />
      </div>
    );
  },
);

BadgeContainer.displayName = 'BadgeContainer';

interface BadgeViewerProps {
  badges: Badge[];
  maxDisplay?: number;
}

const BadgeViewer: React.FC<BadgeViewerProps> = React.memo(
  ({ badges, maxDisplay = 99 }) => {
    const [activeTooltip, setActiveTooltip] = useState<{
      badge: Badge;
      position: { top: number; left: number; placement: 'top' | 'bottom' };
    } | null>(null);

    const calculateTooltipPosition = (
      rect: DOMRect,
    ): { top: number; left: number; placement: 'top' | 'bottom' } => {
      const TOOLTIP_WIDTH = 144; // w-36 = 9rem = 144px
      const TOOLTIP_HEIGHT = 76; // 預估高度
      const SPACING = 8; // 間距

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // 計算水平位置
      let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      left = Math.max(
        SPACING,
        Math.min(left, windowWidth - TOOLTIP_WIDTH - SPACING),
      );

      // 決定是否顯示在上方或下方
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placement =
        spaceBelow >= TOOLTIP_HEIGHT + SPACING || spaceBelow >= spaceAbove
          ? 'bottom'
          : 'top';

      const top =
        placement === 'bottom'
          ? rect.bottom + SPACING
          : rect.top - TOOLTIP_HEIGHT - SPACING;

      return { top, left, placement };
    };

    const handleMouseEnter = (badge: Badge) => (rect: DOMRect) => {
      const position = calculateTooltipPosition(rect);
      setActiveTooltip({ badge, position });
    };

    const handleMouseLeave = () => {
      setActiveTooltip(null);
    };

    const sortedBadges = [...badges]
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
      .slice(0, maxDisplay);

    return (
      <>
        <div className="flex space-x-1">
          {sortedBadges.map((badge) => (
            <BadgeContainer
              key={badge.id}
              badge={badge}
              onMouseEnter={handleMouseEnter(badge)}
              onMouseLeave={handleMouseLeave}
              showTooltip={activeTooltip?.badge.id === badge.id}
            />
          ))}
        </div>
        {activeTooltip && (
          <Tooltip
            badge={activeTooltip.badge}
            position={activeTooltip.position}
          />
        )}
      </>
    );
  },
);

BadgeViewer.displayName = 'BadgeViewer';

export default BadgeViewer;
