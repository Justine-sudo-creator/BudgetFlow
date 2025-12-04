"use client";

// Basic markdown-to-React component.
// NOTE: This is NOT a full-featured markdown parser. It only handles some basic formatting
// for the AI suggestions. For a real app, you would want to use a more robust library
// like 'react-markdown'.

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');

  const renderLine = (line: string) => {
    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics (using * instead of _ for simplicity)
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return { __html: line };
  };

  return (
    <div>
      {lines.map((line, index) => {
        if (line.startsWith('* ')) {
          // Unordered list item
          return <li key={index} dangerouslySetInnerHTML={renderLine(line.substring(2))} />;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="!mt-4 !mb-2" dangerouslySetInnerHTML={renderLine(line.substring(4))} />;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="!mt-6 !mb-2" dangerouslySetInnerHTML={renderLine(line.substring(3))} />;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} dangerouslySetInnerHTML={renderLine(line)} />;
      })}
    </div>
  );
}
