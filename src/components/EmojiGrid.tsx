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
      <div className={`absolute bottom-0 ${isOpen ? 'block' : 'hidden'}`}>
        <ul className="w-[280px] h-[168px] border-l border-t border-[#E3E9F6] flex flex-wrap bg-white transform translate-y-[-30%]">
          {emojis.map((emoji: Emoji) => (
            <li
              key={emoji.id}
              className="border-b border-r border-[#E3E9F6] w-7 h-7 flex items-center justify-center"
            >
              <span
                className="inline-block border border-white m-[1px] p-[2px] hover:border-[#5898FF] cursor-pointer"
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

EmojiGrid.displayName = 'EmojiGrid';

export default EmojiGrid;
