/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useRef } from 'react';

// CSS
import styles from '@/styles/badgeViewer.module.css';

// Types
import type { Badge } from '@/types';

const getInitialColor = (badge: Badge) => {
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

const getDisplayText = (badge: Badge) => {
  const name = badge.name || badge.id;
  return name.slice(0, 1).toUpperCase();
};

const failedImageCache = new Set<string>();

interface BadgeImageProps {
  badge: Badge;
}

const BadgeImage: React.FC<BadgeImageProps> = React.memo(({ badge }) => {
  const [showFallBack, setShowFallBack] = useState(false);

  const badgeUrl = `/badge/${badge.id.trim()}.png`;
  // const badgeName = badge.name || badge.id;

  if (failedImageCache.has(badgeUrl) || showFallBack) {
    return (
      // Fallback Badge
      <div className={styles['badgeImage']}>{getDisplayText(badge)}</div>
    );
  }
  return (
    <div
      className={styles['badgeImage']}
      onError={() => {
        failedImageCache.add(badgeUrl);
        setShowFallBack(true);
      }}
    />
  );
});

BadgeImage.displayName = 'BadgeImage';

interface BadgeInfoViewerProps {
  badge: Badge;
  position: { top: number; left: number; placement: 'top' | 'bottom' };
}

const BadgeInfoViewer: React.FC<BadgeInfoViewerProps> = React.memo(
  ({ badge, position }) => {
    return (
      <div
        className={`${styles['badgeInfoViewerWrapper']} ${
          styles[position.placement]
        }`}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className={styles['badgeInfoBox']}>
          <BadgeImage badge={badge} />
          <div className={styles['name']}>{badge.name}</div>
        </div>
        <div className={styles['badgeDescriptionBox']}>
          <div className={styles['description']}>{badge.description}</div>
        </div>
      </div>
    );
  },
);

BadgeInfoViewer.displayName = 'BadgeInfoViewer';

interface BadgeContainerProps {
  badge: Badge;
  onMouseEnter: (rect: DOMRect) => void;
  onMouseLeave: () => void;
}

const BadgeContainer: React.FC<BadgeContainerProps> = React.memo(
  ({ badge, onMouseEnter, onMouseLeave }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      if (containerRef.current) {
        onMouseEnter(containerRef.current.getBoundingClientRect());
      }
    };

    return (
      <div
        ref={containerRef}
        className={styles['badgeContainer']}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <BadgeImage badge={badge} />
      </div>
    );
  },
);

BadgeContainer.displayName = 'BadgeContainer';

interface BadgeViewerProps {
  badges: Badge[] | null;
  maxDisplay?: number;
}

const BadgeViewer: React.FC<BadgeViewerProps> = React.memo(
  ({ badges, maxDisplay = 99 }) => {
    if (!badges) return null;

    const [expanded, setExpended] = useState<{
      badge: Badge;
      position: { top: number; left: number; placement: 'top' | 'bottom' };
    } | null>(null);

    const calculateTooltipPosition = (
      rect: DOMRect,
    ): { top: number; left: number; placement: 'top' | 'bottom' } => {
      const INFOVIEWER_WIDTH = 144;
      const INFOVIEWER_HEIGHT = 76;
      const SPACING = 8;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let left = rect.left - INFOVIEWER_WIDTH / 2;
      left = Math.max(
        SPACING,
        Math.min(left, windowWidth - INFOVIEWER_WIDTH - SPACING),
      );

      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placement =
        spaceBelow >= INFOVIEWER_HEIGHT + SPACING || spaceBelow >= spaceAbove
          ? 'bottom'
          : 'top';

      const top =
        placement === 'bottom'
          ? rect.bottom + SPACING
          : rect.top - INFOVIEWER_HEIGHT - SPACING;

      return { top, left, placement };
    };

    const handleMouseEnter = (badge: Badge) => (rect: DOMRect) => {
      const position = calculateTooltipPosition(rect);
      setExpended({ badge, position });
    };

    const handleMouseLeave = () => {
      setExpended(null);
    };

    const sortedBadges = [...badges]
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))
      .slice(0, maxDisplay);

    return (
      <>
        <div className={styles['badgeViewerWrapper']}>
          {sortedBadges.map((badge) => (
            <BadgeContainer
              key={badge.id}
              badge={badge}
              onMouseEnter={handleMouseEnter(badge)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </div>
        {expanded && (
          <BadgeInfoViewer
            badge={expanded.badge}
            position={expanded.position}
          />
        )}
      </>
    );
  },
);

BadgeViewer.displayName = 'BadgeViewer';

export default BadgeViewer;
