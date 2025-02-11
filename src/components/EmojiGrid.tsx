import React from 'react';

// Components
import emojis from '@/components/emojis';

interface Emoji {
  id: number;
  path: string;
  alt: string;
}

interface EmojiGridProps {
  onEmojiSelect?: (emoji: string) => void;
  isOpen: boolean;
}

const EmojiGrid: React.FC<EmojiGridProps> = ({ onEmojiSelect, isOpen }) => {
  return (
    <div className="relative">
      <div className={`absolute bottom-10 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-8 w-48 gap-1 p-2 bg-white border border-gray-200 rounded shadow-md">
          {emojis.map((emoji: Emoji) => (
            <span
              className="w-5 h-5 inline-block border border-white hover:border-[#5898FF] cursor-pointer"
              onClick={() => {
                onEmojiSelect?.(`[emoji_${emoji.id}]`);
              }}
              title={emoji.alt}
            >
              <img
                src={emoji.path}
                alt={emoji.alt}
                className="w-5 h-5"
                draggable={false}
                loading="lazy"
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

EmojiGrid.displayName = 'EmojiGrid';

export default EmojiGrid;
