// Minimal HTML sanitizer for publication titles returned from external APIs.
// Allows only inline formatting tags commonly used in scientific titles
// (italic for species names, sub/sup for chemical formulas, etc.) and
// strips everything else, including scripts, event handlers, and links.
const ALLOWED_TAGS = new Set([
  'I', 'EM', 'B', 'STRONG', 'SUB', 'SUP', 'U', 'SMALL', 'MARK',
]);

const escapeText = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));

export const sanitizeTitleHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return escapeText(String(html));
  }
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeText(node.textContent ?? '');
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName;
      const inner = Array.from(el.childNodes).map(walk).join('');
      if (ALLOWED_TAGS.has(tag)) {
        const lower = tag.toLowerCase();
        return `<${lower}>${inner}</${lower}>`;
      }
      return inner;
    }
    return '';
  };
  return Array.from(doc.body.childNodes).map(walk).join('');
};
