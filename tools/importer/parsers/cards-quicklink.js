/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-quicklink (base: cards).
 * Source: https://www.texasmutual.com/ (section.quick-links)
 * Generated for xwalk project.
 *
 * Source structure: section.quick-links contains 6 anchor tiles. Each tile:
 *   <a href="...">
 *     <div class="injury" style="background-image:url('/assets/images/icons/icon-x.svg');"></div>
 *     <div>Short Label</div>
 *   </a>
 * The icon is rendered as a CSS background-image on the .injury div in the live DOM
 * (an <img> in some cleaned snapshots) — both forms are handled below.
 *
 * Target (xwalk container block): one row per card with two columns:
 *   - image cell -> <!-- field:image --> + <img> (icon)
 *   - text  cell -> <!-- field:text -->  + link-wrapped label (preserves tile href)
 */
export default function parse(element, { document }) {
  // Each tile is a direct anchor child of the section. Fallback to any descendant
  // anchor that contains an icon div or image, to tolerate wrapper variations.
  let tiles = Array.from(element.querySelectorAll(':scope > a'));
  if (!tiles.length) {
    tiles = Array.from(element.querySelectorAll('a')).filter(
      (a) => a.querySelector('div.injury, div[style*="background-image"], img'),
    );
  }

  // Resolve a possibly-relative URL against the page origin.
  const toAbsolute = (src) => {
    if (!src) return src;
    try {
      return new URL(src, document.baseURI || window.location.href).href;
    } catch (e) {
      return src;
    }
  };

  // Pull an icon URL from either an <img> src or a CSS background-image style.
  const getIconUrl = (tile) => {
    const img = tile.querySelector('img');
    if (img && img.getAttribute('src')) return toAbsolute(img.getAttribute('src'));
    const iconDiv = tile.querySelector('div.injury, div[style*="background-image"]');
    const style = iconDiv ? iconDiv.getAttribute('style') || '' : '';
    const match = style.match(/url\((['"]?)([^'")]+)\1\)/);
    return match ? toAbsolute(match[2]) : null;
  };

  const cells = [];

  tiles.forEach((tile) => {
    const href = tile.getAttribute('href');
    const iconUrl = getIconUrl(tile);

    // Label: the tile's text content (icon div has no text in either form).
    const labelDiv = Array.from(tile.querySelectorAll(':scope > div')).find(
      (div) => div.textContent.trim() && !div.querySelector('img'),
    );
    const labelText = (labelDiv ? labelDiv.textContent : tile.textContent).trim();

    if (!iconUrl && !labelText) return; // skip empty tiles

    // --- image cell: real <img> so the reference/image field is populated ---
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (iconUrl) {
      const img = document.createElement('img');
      img.setAttribute('src', iconUrl);
      img.setAttribute('alt', labelText || '');
      imageCell.appendChild(img);
    }

    // --- text cell: link-wrapped label so the tile href is preserved ---
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (href) {
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = labelText;
      textCell.appendChild(link);
    } else {
      const p = document.createElement('p');
      p.textContent = labelText;
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Empty-block guard: no usable tiles found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-quicklink', cells });
  element.replaceWith(block);
}
