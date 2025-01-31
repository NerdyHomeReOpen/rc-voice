import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";

const MarkdownViewer = ({ markdownText }) => {
  return (
    <div className="flex-1">
      <ReactMarkdown
        className="markdown-content"
        children={markdownText}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children }) => <p className="mb-1">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} className="text-blue-600 hover:underline">
              {children}
            </a>
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 text-gray-900" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mb-3 text-gray-800" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mb-2 text-gray-700" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="leading-relaxed text-gray-600" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc list-inside mb-4 space-y-1 text-gray-600"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal list-inside mb-4 space-y-1 text-gray-600"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 mb-4 italic text-gray-600"
              {...props}
            />
          ),
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";

            return !inline ? (
              <div className="mb-4">
                <SyntaxHighlighter
                  style={tomorrow}
                  language={lang}
                  PreTag="div"
                  className="rounded"
                  customStyle={{
                    margin: 0,
                    padding: "0.5rem",
                    backgroundColor: "#1a1a1a",
                    fontSize: "0.8rem",
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-sm">
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:text-blue-800 underline transition duration-200"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table
                className="min-w-full border-collapse border border-gray-200"
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
        }}
      />
    </div>
  );
};

export default MarkdownViewer;
