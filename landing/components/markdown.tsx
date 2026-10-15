import type { ReactNode } from "react";

// A deliberately small Markdown subset for blog posts, rendered straight to
// React elements — never to an HTML string — so post text can't inject markup.
//
//   ## Heading / ### Subheading     - item / 1. item     > quote
//   **bold**  *italic*  `code`  [link](https://…)  ![alt](https://…)
//   ``` fenced code ```             --- (divider)       blank line = new paragraph

type Block =
  | { kind: "h2" | "h3" | "p" | "quote"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "img"; alt: string; src: string }
  | { kind: "hr" };

// Only web, mail and phone links, or paths on this site. Anything else
// (javascript:, data:, …) renders as plain text.
function safeHref(url: string) {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const { protocol } = new URL(url);
    return ["http:", "https:", "mailto:", "tel:"].includes(protocol) ? url : null;
  } catch {
    return null;
  }
}

function safeImageSrc(url: string) {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i]);
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    if (!trimmed) {
      flush();
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flush();
      blocks.push({ kind: heading[1].length === 3 ? "h3" : "h2", text: heading[2] });
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flush();
      blocks.push({ kind: "hr" });
      continue;
    }
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
    if (image) {
      flush();
      const src = safeImageSrc(image[2]);
      if (src) blocks.push({ kind: "img", alt: image[1], src });
      continue;
    }
    if (trimmed.startsWith(">")) {
      flush();
      const quote = [trimmed.replace(/^>\s?/, "")];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith(">"))
        quote.push(lines[++i].trim().replace(/^>\s?/, ""));
      blocks.push({ kind: "quote", text: quote.join(" ") });
      continue;
    }
    const listMatch = /^([-*]|\d+[.)])\s+/.exec(trimmed);
    if (listMatch) {
      flush();
      const ordered = /\d/.test(listMatch[1]);
      const pattern = ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/;
      const items = [trimmed.replace(pattern, "")];
      while (i + 1 < lines.length && pattern.test(lines[i + 1].trim()))
        items.push(lines[++i].trim().replace(pattern, ""));
      blocks.push({ kind: ordered ? "ol" : "ul", items });
      continue;
    }
    paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

function renderInline(text: string, keyPrefix = ""): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={key} className="font-semibold text-ink">{renderInline(part.slice(2, -2), `${key}-`)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={key} className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">{part.slice(1, -1)}</code>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return link[1];
      const external = /^https?:/.test(href);
      return (
        <a
          key={key}
          href={href}
          className="font-semibold text-brand underline underline-offset-2 hover:text-brand-dark"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {renderInline(link[1], `${key}-`)}
        </a>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_")))
      return <em key={key}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function Markdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-5 text-[15px] leading-[1.8] text-muted">
      {parseBlocks(source).map((block, i) => {
        switch (block.kind) {
          case "h2":
            return (
              <h2 key={i} className="mt-6 font-display text-[clamp(1.3rem,2.4vw,1.7rem)] font-bold leading-tight text-ink">
                {renderInline(block.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-3 font-display text-lg font-bold leading-snug text-ink">
                {renderInline(block.text)}
              </h3>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-4 border-brand/40 pl-5 font-display text-lg italic text-ink/80">
                {renderInline(block.text)}
              </blockquote>
            );
          case "ul":
          case "ol": {
            const List = block.kind === "ul" ? "ul" : "ol";
            return (
              <List key={i} className={`flex flex-col gap-2 pl-6 ${block.kind === "ul" ? "list-disc" : "list-decimal"} marker:text-brand`}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </List>
            );
          }
          case "code":
            return (
              <pre key={i} className="overflow-x-auto rounded-xl border border-line bg-cream-soft p-4 font-mono text-[13px] leading-relaxed text-ink">
                <code>{block.text}</code>
              </pre>
            );
          case "img":
            return (
              // Any https host: next/image would need every host allow-listed.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={block.src} alt={block.alt} loading="lazy" className="w-full rounded-2xl border border-line" />
            );
          case "hr":
            return <hr key={i} className="my-2 border-line" />;
          default:
            return <p key={i}>{renderInline(block.text)}</p>;
        }
      })}
    </div>
  );
}
