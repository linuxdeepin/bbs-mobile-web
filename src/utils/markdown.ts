import MarkdownIt from "markdown-it";
import { parseDocument, DomUtils } from "htmlparser2";
import { FilterXSS, getDefaultWhiteList } from "xss";
import { encode as encodeBase64 } from "js-base64";
import customEmoji from "../pages/thread/customEmoji.json";

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: true });
const escape = markdown.utils.escapeHtml;
const emoji: Record<string, string> = customEmoji;

function emojiPath(name: string): string {
  if (!Object.prototype.hasOwnProperty.call(emoji, name)) return "";
  // XSS filtering rejects bare relative image paths such as assets/image/....
  return `/${encodeURI(emoji[name].replace(/^\/+/, ""))}`;
}

markdown.renderer.rules.text = (tokens, index) => escape(tokens[index].content).replace(
  /:([\w]+):/g,
  (original, name: string) => {
    const src = emojiPath(name);
    return src ? `<img class="emoji" src="${escape(src)}" alt="${escape(name)}">` : original;
  }
);

const whiteList = getDefaultWhiteList();
for (const name of Object.keys(whiteList)) {
  whiteList[name] = [...(whiteList[name] || []), "class", "style"];
}
whiteList.del = ["class", "style"];
whiteList.s = ["class", "style"];
whiteList.div!.push("data-editer_version", "data-vditor_version", "data-weapp_version");
const sanitizer = new FilterXSS({
  whiteList,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  css: {
    whiteList: {
      "text-align": /^(left|right|center|justify)$/,
      "font-weight": /^(normal|bold|[1-9]00)$/,
      "font-style": /^(normal|italic)$/,
      "text-decoration": /^(none|underline|line-through)$/,
      color: /^#[\da-f]{3,8}$|^[a-z]+$|^rgba?\([\d\s.,%]+\)$/i,
      "background-color": /^#[\da-f]{3,8}$|^[a-z]+$|^rgba?\([\d\s.,%]+\)$/i,
    },
  },
});

/** Markdown is converted before submission so the existing forum API continues to receive HTML. */
export function renderMarkdown(source: string): string {
  return sanitizer.process(markdown.render(source));
}

export function createMessage(source: string, images: string[] = []): string {
  let draft = source.trim();
  if (images.length) {
    // Finish an open top-level code fence so uploaded images remain separate attachments.
    const tokens = markdown.parse(draft, {});
    const last = tokens[tokens.length - 1];
    if (last?.type === "fence" && last.map) {
      const [start, end] = last.map;
      const lastLine = draft.split("\n")[end - 1] || "";
      const closing = new RegExp(`^ {0,3}${last.markup[0]}{${last.markup.length},}[\\t ]*$`);
      if (end - start < 2 || !closing.test(lastLine)) draft += `\n${last.markup}`;
    }
    draft = [draft, ...images.map(url => `![图片](<${markdown.normalizeLink(url)}>)`)]
      .filter(Boolean).join("\n\n");
  }
  // The web forum renders v2 messages from Base64 UTF-8 Markdown in data-value.
  // Keep a sanitized HTML fallback; Base64 contains no HTML attribute delimiters.
  return `<div class="vditor-reset" data-editer_version="v2" data-value="${encodeBase64(draft)}">${renderMarkdown(draft)}</div>`;
}

export interface ContentBlock {
  type: "html" | "table";
  html: string;
  minWidth?: number;
}

type Node = ReturnType<typeof parseDocument>["children"][number];
const htmlPattern = /^\s*<(?:div|p|h[1-6]|ul|ol|li|pre|blockquote|table|span|img|br|section|article|figure|a|strong|em)\b/i;

// Preserve Unicode for mini programs while keeping HTML metacharacters escaped.
const serializeNode = (node: Node) => DomUtils.getOuterHTML(node, { encodeEntities: "utf8" });

function resolveImageURL(url: string, server: string) {
  if (url.startsWith("//")) return `https:${url}`;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^data:image\/(?:png|gif|jpe?g|webp);base64,/i.test(url)) return url;
  return `${server.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

/** Retain legacy HTML, and render raw Markdown returned by older/newer API versions as well. */
export function prepareContent(source: string, server: string, format: "auto" | "markdown" = "auto") {
  const html = format === "auto" && htmlPattern.test(source)
    ? sanitizer.process(source) : renderMarkdown(source);
  const root = parseDocument(html);
  const images: string[] = [];
  function decorate(node: Node) {
    if (!("attribs" in node)) return;
    if (node.name === "img") {
      const isEmoji = (node.attribs.class || "").split(/\s+/).includes("emoji");
      // Recover known emoji in older posts whose sanitized HTML contains an empty src.
      const knownEmoji = isEmoji && [node.attribs.alt, node.attribs.title]
        .map(name => emojiPath((name || "").replace(/^:|:$/g, ""))).find(Boolean);
      const imageSource = knownEmoji || node.attribs.src;
      if (imageSource) {
        const src = resolveImageURL(imageSource, server);
        node.attribs.src = src;
        node.attribs["data-src"] = src;
        node.attribs["data-tag"] = "img";
        node.attribs.mode = isEmoji ? "aspectFit" : "widthFix";
        node.attribs.style = isEmoji
          ? "width:24px;height:24px;vertical-align:middle;"
          : "max-width:100%;height:auto;";
        if (!isEmoji) images.push(src);
      }
    }
    if (node.name === "a") {
      node.attribs["data-tag"] = "a";
      node.attribs["data-href"] = node.attribs.href || "";
      node.attribs.target = "_blank";
      node.attribs.rel = "noopener noreferrer";
    }
    if (node.name === "table") node.attribs.style = "border-collapse:collapse;width:100%;table-layout:auto;";
    if (node.name === "td" || node.name === "th") {
      node.attribs.style = `border:1px solid #888;padding:8px;vertical-align:top;word-break:normal;${node.attribs.style || ""}`;
    }
    node.children.forEach(decorate);
  }
  root.children.forEach(decorate);

  function split(node: Node): ContentBlock[] {
    if (!("attribs" in node)) return [{ type: "html", html: serializeNode(node) }];
    if (node.name === "table") {
      const rows = DomUtils.findAll(child => child.name === "tr", node.children);
      const columns = Math.max(1, ...rows.map(row => row.children.reduce((count, cell) =>
        count + ("attribs" in cell && (cell.name === "td" || cell.name === "th")
          ? Math.max(1, Number(cell.attribs.colspan) || 1) : 0), 0)));
      return [{ type: "table", html: serializeNode(node), minWidth: Math.min(columns, 50) * 120 }];
    }
    // Split tables out of editor <div> wrappers without losing surrounding paragraphs.
    if (!DomUtils.findOne(child => child.name === "table", node.children)) {
      return [{ type: "html", html: serializeNode(node) }];
    }
    const children = merge(node.children.flatMap(split));
    const attrs = Object.entries(node.attribs).map(([key, value]) => ` ${key}="${escape(value)}"`).join("");
    return children.map(block => block.type === "table" ? block : {
      ...block, html: `<${node.name}${attrs}>${block.html}</${node.name}>`,
    });
  }
  return { blocks: merge(root.children.flatMap(split)), images: [...new Set(images)] };
}

function merge(blocks: ContentBlock[]): ContentBlock[] {
  const result: ContentBlock[] = [];
  for (const block of blocks) {
    const previous = result[result.length - 1];
    if (previous?.type === "html" && block.type === "html") previous.html += block.html;
    else result.push({ ...block });
  }
  return result.filter(block => block.type === "table" || block.html.trim());
}
