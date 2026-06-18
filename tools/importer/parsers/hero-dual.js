/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-dual. Base block: hero.
 * Source: https://www.texasmutual.com/ (section.hero-section / #HOME)
 * Generated: 2026-06-18
 *
 * xwalk simple block. UE model (blocks/hero-dual/_hero-dual.json):
 *   - image  (reference)            -> row 1, field:image
 *   - imageAlt (collapsed -> img alt, no hint)
 *   - text   (richtext)             -> row 2, field:text
 *
 * Source structure: the hero section holds two responsive rows — a mobile row
 * (d-lg-none) and a desktop row (d-lg-block). The desktop row carries the
 * full-bleed background image in .hero-bg > img plus a two-panel content area
 * (.texas-safe / .texas-strong). Each panel exposes its DESKTOP copy via
 * .d-none.d-lg-block elements; the tablet (.d-none.d-md-block.d-lg-none) and
 * phone (.d-md-none) variants duplicate the same words and must be excluded.
 *
 * Extraction strategy:
 *   - image: prefer the desktop .hero-bg img, then any panel image, then any img.
 *   - text:  walk .texas-safe first, then .texas-strong, taking only the desktop
 *            (.d-none.d-lg-block) headings/paragraphs so the dual panels read
 *            Safe -> Strong in order with no duplicated/empty responsive copies.
 */
export default function parse(element, { document }) {
  // Scope to the desktop row when present (it holds the background + clean copy).
  const desktopRow = element.querySelector('.row.d-lg-block, .row.d-xl-block') || element;

  // --- Background image (field:image) -------------------------------------
  const bgImage = desktopRow.querySelector('.hero-bg img')
    || element.querySelector('.hero-bg img')
    || element.querySelector('.texas-safe img, .texas-strong img')
    || element.querySelector('img');

  // --- Text content (field:text) ------------------------------------------
  const textNodes = [];
  const seen = new Set();

  const collectDesktop = (panel) => {
    if (!panel) return;
    // Only the desktop-visible copy: elements that are themselves .d-none.d-lg-block
    // (e.g. .texas-safe's inline h1/p) or live inside a .d-none.d-lg-block wrapper
    // (e.g. .texas-strong's content). This excludes tablet/phone duplicates.
    const candidates = panel.querySelectorAll(
      ':scope > h1.d-lg-block, :scope > h2.d-lg-block, :scope > h3.d-lg-block, :scope > p.d-lg-block, :scope > .d-none.d-lg-block h1, :scope > .d-none.d-lg-block h2, :scope > .d-none.d-lg-block h3, :scope > .d-none.d-lg-block p',
    );
    candidates.forEach((node) => {
      const txt = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt) return; // skip empty placeholder headings/paragraphs
      if (seen.has(txt)) return; // de-duplicate
      seen.add(txt);
      textNodes.push(node);
    });
  };

  const safePanel = desktopRow.querySelector('.texas-safe') || element.querySelector('.texas-safe');
  const strongPanel = desktopRow.querySelector('.texas-strong') || element.querySelector('.texas-strong');

  collectDesktop(safePanel);
  collectDesktop(strongPanel);

  // Fallback: if the responsive desktop selectors matched nothing, take all
  // non-empty, de-duplicated headings/paragraphs in document order.
  if (!textNodes.length) {
    element.querySelectorAll('h1, h2, h3, p').forEach((node) => {
      const txt = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt || seen.has(txt)) return;
      seen.add(txt);
      textNodes.push(node);
    });
  }

  // --- Empty-block guard ---------------------------------------------------
  if (!bgImage && !textNodes.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // --- Build cells with field hints (xwalk) -------------------------------
  // Row 1: image (field:image). imageAlt is a collapsed field -> img alt attr, no hint.
  const imageCell = document.createDocumentFragment();
  if (bgImage) {
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(bgImage);
  }

  // Row 2: text richtext (field:text).
  const textCell = document.createDocumentFragment();
  if (textNodes.length) {
    textCell.appendChild(document.createComment(' field:text '));
    textNodes.forEach((node) => textCell.appendChild(node));
  }

  const cells = [
    [imageCell],
    [textCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-dual', cells });
  element.replaceWith(block);
}
