export interface MarkdownEdit {
  value: string;
  start: number;
  end: number;
}

export function insertMarkdown(
  value: string, start: number, end: number, before: string, after = "", placeholder = ""
): MarkdownEdit {
  start = Math.max(0, Math.min(value.length, start));
  end = Math.max(start, Math.min(value.length, end));
  const selected = value.slice(start, end) || placeholder;
  return {
    value: value.slice(0, start) + before + selected + after + value.slice(end),
    start: start + before.length,
    end: start + before.length + selected.length,
  };
}
