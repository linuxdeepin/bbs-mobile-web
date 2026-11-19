import { Parser } from "htmlparser2";

/** Decode one text/attribute layer without interpreting literal markup as elements. */
export function decodeHtmlEntities(value: string, attribute = false): string {
  if (!value.includes("&")) return value;
  let decoded = "";
  const parser = new Parser({
    ontext: text => { if (!attribute) decoded += text; },
    onattribute: (name, text) => { if (attribute && name === "value") decoded = text; },
  }, { decodeEntities: true });
  // Escape literal '<' first: entities are decoded as text, never parsed a second time as tags.
  const text = value.replace(/</g, "&lt;");
  parser.end(attribute ? `<span value="${text.replace(/"/g, "&quot;")}"></span>` : text);
  return decoded;
}
