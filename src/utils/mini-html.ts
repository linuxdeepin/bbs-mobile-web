import { options } from "@tarojs/runtime";
import { decodeHtmlEntities } from "./html-entities";

let installed = false;
const textAttributes = ["src", "href", "data-src", "data-href", "alt", "title", "poster"];

/** Taro 4's mini HTML parser copies entities verbatim; decode only after nodes are parsed. */
export function installMiniHtmlEntityDecoding() {
  const html = options.html;
  if (!html || installed) return;
  installed = true;
  const previousText = html.transformText;
  const previousElement = html.transformElement;
  html.transformText = (text, source) => {
    text.textContent = decodeHtmlEntities(text.textContent);
    return previousText ? previousText(text, source) : text;
  };
  html.transformElement = (element, source) => {
    for (const name of textAttributes) {
      const value = element.getAttribute(name);
      if (typeof value === "string" && value.includes("&")) {
        element.setAttribute(name, decodeHtmlEntities(value, true));
      }
    }
    return previousElement ? previousElement(element, source) : element;
  };
}
