"use client";

import React from "react";

type Props = {
    content: string;
    className?: string;
};

/**
 * Lightweight markdown renderer for flashcard content.
 * Supports: bold, italic, inline code, code blocks, lists, headings, images.
 */
export default function MarkdownRenderer({ content, className = "" }: Props) {
    const nodes = parseBlocks(content);
    return <div className={`markdown ${className}`}>{nodes}</div>;
}

// ─── Block-level parser ───────────────────────────────────────────────────────

function parseBlocks(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    const nodes: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Fenced code block  ```lang
        if (line.startsWith("```")) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            nodes.push(
                <pre
                    key={key++}
                    className="bg-black/60 rounded-lg p-3 text-left overflow-x-auto text-sm font-mono text-emerald-300 my-2 border border-white/10 whitespace-pre"
                >
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
            i++; // skip closing ```
            continue;
        }

        // Headings
        const heading = line.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
            const level = heading[1].length;
            const cls =
                level === 1
                    ? "text-xl font-bold mt-2 mb-1"
                    : level === 2
                    ? "text-lg font-bold mt-2 mb-1"
                    : "text-base font-semibold mt-1";
            nodes.push(
                <div key={key++} className={cls}>
                    {parseInline(heading[2])}
                </div>
            );
            i++;
            continue;
        }

        // Unordered list item
        if (/^[-*+]\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^[-*+]\s+/, ""));
                i++;
            }
            nodes.push(
                <ul key={key++} className="list-disc list-inside text-left space-y-0.5 my-1 pl-2">
                    {items.map((item, j) => (
                        <li key={j}>{parseInline(item)}</li>
                    ))}
                </ul>
            );
            continue;
        }

        // Ordered list item
        if (/^\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s+/, ""));
                i++;
            }
            nodes.push(
                <ol key={key++} className="list-decimal list-inside text-left space-y-0.5 my-1 pl-2">
                    {items.map((item, j) => (
                        <li key={j}>{parseInline(item)}</li>
                    ))}
                </ol>
            );
            continue;
        }

        // Empty line → spacer
        if (line.trim() === "") {
            nodes.push(<div key={key++} className="h-1" />);
            i++;
            continue;
        }

        // Standalone image URL (bare URL ending in image ext)
        const bareImgUrl = line.trim().match(
            /^(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|svg)(\?\S*)?)$/i
        );
        if (bareImgUrl) {
            nodes.push(
                <img
                    key={key++}
                    src={bareImgUrl[1]}
                    alt=""
                    className="max-w-full max-h-48 mx-auto rounded-lg object-contain my-2 block"
                />
            );
            i++;
            continue;
        }

        // Standalone markdown image ![alt](url)
        const mdImg = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (mdImg) {
            nodes.push(
                <img
                    key={key++}
                    src={mdImg[2]}
                    alt={mdImg[1]}
                    className="max-w-full max-h-48 mx-auto rounded-lg object-contain my-2 block"
                />
            );
            i++;
            continue;
        }

        // Paragraph (inline content)
        nodes.push(
            <div key={key++} className="leading-relaxed">
                {parseInline(line)}
            </div>
        );
        i++;
    }

    return nodes;
}

// ─── Inline parser ────────────────────────────────────────────────────────────
// Handles: **bold**, *italic*, __bold__, _italic_, `code`, ![img](url)

const INLINE_PATTERN =
    /\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)|`([^`]+)`|!\[([^\]]*)\]\(([^)]+)\)/g;

function parseInline(text: string): React.ReactNode {
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let k = 0;

    // Reset regex state
    INLINE_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;
    // We need a fresh regex per call since it has state
    const re =
        /\*\*(.+?)\*\*|__(.+?)__|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)|`([^`]+)`|!\[([^\]]*)\]\(([^)]+)\)/g;

    while ((match = re.exec(text)) !== null) {
        // Text before this match
        if (match.index > lastIndex) {
            nodes.push(<span key={k++}>{text.slice(lastIndex, match.index)}</span>);
        }

        if (match[1] !== undefined) {
            // **bold**
            nodes.push(<strong key={k++}>{match[1]}</strong>);
        } else if (match[2] !== undefined) {
            // __bold__
            nodes.push(<strong key={k++}>{match[2]}</strong>);
        } else if (match[3] !== undefined) {
            // *italic*
            nodes.push(<em key={k++}>{match[3]}</em>);
        } else if (match[4] !== undefined) {
            // _italic_
            nodes.push(<em key={k++}>{match[4]}</em>);
        } else if (match[5] !== undefined) {
            // `code`
            nodes.push(
                <code
                    key={k++}
                    className="bg-black/60 text-emerald-300 px-1.5 py-0.5 rounded text-[0.85em] font-mono border border-white/10"
                >
                    {match[5]}
                </code>
            );
        } else if (match[6] !== undefined && match[7] !== undefined) {
            // ![alt](url)
            nodes.push(
                <img
                    key={k++}
                    src={match[7]}
                    alt={match[6]}
                    className="max-w-full max-h-32 rounded-lg object-contain inline-block mx-1 align-middle"
                />
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < text.length) {
        nodes.push(<span key={k++}>{text.slice(lastIndex)}</span>);
    }

    if (nodes.length === 0) return text;
    if (nodes.length === 1) return nodes[0];
    return <>{nodes}</>;
}
