import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

// Componenets
import emojis from '@/components/emojis';

interface PurifyConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ALLOWED_URI_REGEXP: RegExp;
}

interface MarkdownProps {
  markdownText: string;
}
const Markdown: React.FC<MarkdownProps> = React.memo(({ markdownText }) => {
  const purifyConfig: PurifyConfig = {
    ALLOWED_TAGS: [
      'img',
      'p',
      'h1',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
      'br',
      'strong',
      'em',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'href'],
    ALLOWED_URI_REGEXP: /^\/smiles\//,
  };

  const processEmojis = (text: string): string => {
    return text.replace(/\[emoji_(\d+)\]/g, (match: string, id: string) => {
      const emojiId = parseInt(id);
      if (!emojis.find((emoji) => emoji.id === emojiId)) return match;
      return `<img src="/smiles/${
        emojiId + 1
      }.gif" alt="[emoji_${id}]" class="inline-block w-5 h-5 align-text-bottom" />`;
    });
  };

  const withEmojis = processEmojis(markdownText);
  const sanitized = DOMPurify.sanitize(withEmojis, purifyConfig);

  const components: Components = {
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mb-2 text-gray-900" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-bold mb-1 text-gray-800" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-bold text-gray-700" {...props} />
    ),
    p: ({ node, ...props }) => (
      <div className="leading-relaxed text-gray-600" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside text-gray-600" {...props} />
    ),
    li: ({ node, ...props }) => <li className="leading-normal" {...props} />,
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside text-gray-600" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-gray-300 pl-4 italic text-gray-600 overflow-x-auto"
        {...props}
      />
    ),
    a: ({ node, href, ...props }) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline transition duration-200"
        {...props}
      />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto mb-4 max-w-full">
        <table
          className="w-full border-collapse border border-gray-200"
          {...props}
        />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th
        className="px-4 py-2 bg-gray-50 text-left text-sm font-semibold text-gray-600 border border-gray-200"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td
        className="px-4 py-2 text-sm text-gray-600 border border-gray-200"
        {...props}
      />
    ),
    hr: ({ node, ...props }) => (
      <hr className="my-6 border-t border-gray-200" {...props} />
    ),
  };

  return (
    <ReactMarkdown
      className="markdown-content whitespace-pre-wrap"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {sanitized}
    </ReactMarkdown>
  );
});

interface MarkdownViewerProps {
  markdownText: string;
}
const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(
  ({ markdownText }) => {
    return (
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-full overflow-x-auto">
          <Markdown markdownText={markdownText} />
        </div>
      </div>
    );
  },
);
MarkdownViewer.displayName = 'MarkdownViewer';

export default MarkdownViewer;
