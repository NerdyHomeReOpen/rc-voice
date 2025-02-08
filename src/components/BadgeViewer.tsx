import React, { useState, useRef, useEffect, memo } from 'react';

// Types
import type { Badge } from '@/types';

interface BadgeViewerProps {
  badges: Badge[];
  maxDisplay?: number;
}

interface BadgeImageProps {
  badge: Badge;
}

// Memoized BadgeImage component
const BadgeImage = memo(({ badge }: BadgeImageProps) => {
  const [imageError, setImageError] = useState(false);

  // 生成首字母頭像的顏色（基於徽章ID或名稱）
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

  // 獲取顯示的文字（取首字）
  const getDisplayText = () => {
    const name = badge.name || badge.id;
    return name.slice(0, 1).toUpperCase();
  };

  return imageError ? (
    <div
      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium text-white ${getInitialColor()}`}
    >
      {getDisplayText()}
    </div>
  ) : (
    <img
      src={`/badge/${badge.id.trim()}.png`}
      alt={`${badge.name} Badge`}
      className="select-none w-4 h-4 rounded-full"
      onError={(e) => {
        e.currentTarget.onerror = null;
        setImageError(true);
      }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
});
BadgeImage.displayName = 'BadgeImage';

// Memoized Tooltip component
const BadgeTooltip = memo(
  ({ badge, tooltipClass }: { badge: Badge; tooltipClass: string }) => (
    <div
      className={`absolute z-50 w-36 px-2 py-1 text-sm bg-gray-800 text-white rounded-md shadow-lg pointer-events-none top-full mt-1 ${tooltipClass}`}
    >
      <div
        className={`absolute bottom-full -translate-x-1/2 border-4 border-transparent border-b-gray-800 ${
          tooltipClass.includes('right-0')
            ? 'right-4'
            : tooltipClass.includes('left-0')
            ? 'left-4'
            : 'left-1/2'
        }`}
      />
      <div className="flex flex-row items-center justify-center space-x-2">
        <BadgeImage badge={badge} />
        <div className="font-medium text-center">{badge.name}</div>
      </div>
      <div className="text-xs text-center text-gray-400 mt-1">
        {badge.description}
      </div>
    </div>
  ),
);

BadgeTooltip.displayName = 'BadgeTooltip';

// Memoized Badge container component
const BadgeContainer = memo(
  ({
    badge,
    isActive,
    tooltipClass,
    onMouseEnter,
    onMouseLeave,
    containerRef,
    tooltipRef,
  }: {
    badge: Badge;
    isActive: boolean;
    tooltipClass: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    containerRef: (el: HTMLDivElement | null) => void;
    tooltipRef: React.RefObject<HTMLDivElement>;
  }) => (
    <div
      ref={containerRef}
      className="relative inline-block select-none"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <BadgeImage badge={badge} />
      {isActive && (
        <div ref={tooltipRef}>
          <BadgeTooltip badge={badge} tooltipClass={tooltipClass} />
        </div>
      )}
    </div>
  ),
);

BadgeContainer.displayName = 'BadgeContainer';

// Main BadgeViewer component
const BadgeViewer: React.FC<BadgeViewerProps> = memo(
  ({ badges, maxDisplay = 99 }) => {
    const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
    const [tooltipClass, setTooltipClass] = useState<string>('');
    const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const tooltipRef = useRef<HTMLDivElement>(
      null,
    ) as React.RefObject<HTMLDivElement>;

    // 確保排序不會影響原陣列
    const sortedBadges = [...badges]
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
      .slice(0, maxDisplay);

    useEffect(() => {
      if (
        activeTooltipId &&
        containerRefs.current.get(activeTooltipId) &&
        tooltipRef.current
      ) {
        const containerRect = containerRefs.current
          .get(activeTooltipId)!
          .getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;

        const centerPosition = containerRect.left + containerRect.width / 2;
        const tooltipHalfWidth = tooltipRect.width / 2;
        const wouldOverflowRight =
          centerPosition + tooltipHalfWidth > windowWidth;
        const wouldOverflowLeft = centerPosition - tooltipHalfWidth < 0;

        if (wouldOverflowRight) {
          setTooltipClass('right-0 translate-x-4');
        } else if (wouldOverflowLeft) {
          setTooltipClass('left-0 -translate-x-4');
        } else {
          setTooltipClass('left-1/2 -translate-x-1/2');
        }
      }
    }, [activeTooltipId]);

    return (
      <div className="flex space-x-2">
        {sortedBadges.map((badge) => (
          <BadgeContainer
            key={badge.id}
            badge={badge}
            isActive={activeTooltipId === badge.id}
            tooltipClass={tooltipClass}
            onMouseEnter={() => setActiveTooltipId(badge.id)}
            onMouseLeave={() => setActiveTooltipId(null)}
            containerRef={(el) => {
              if (el) {
                containerRefs.current.set(badge.id, el);
              }
            }}
            tooltipRef={tooltipRef}
          />
        ))}
      </div>
    );
  },
);

BadgeViewer.displayName = 'BadgeViewer';

export default BadgeViewer;
