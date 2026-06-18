/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-feature.
 * Base block: columns (core/franklin/components/columns/v1/columns).
 * Source: https://www.texasmutual.com/ (section[class~="2-column-section"])
 * Generated: 2026-06-18
 *
 * Layout: a single row with two columns. One column holds text content
 * (heading + paragraph + bold links), the other holds an image. The image/text
 * order alternates between instances on the page, so column order is taken
 * directly from the source DOM rather than hardcoded.
 *
 * NOTE: This is a Columns block. Per xwalk field-hinting rules, Columns blocks
 * do NOT use <!-- field:* --> comments — cells contain only default content.
 */
export default function parse(element, { document }) {
  // The two-column layout lives inside .row; fall back to the element itself.
  const rowEl = element.querySelector('.row') || element;

  // Direct column children of the row. Validated against source:
  // div.col-12.col-md-10.col-lg-5 (text) and div.col-12.col-md-10.col-lg-5 (image).
  let columns = Array.from(rowEl.querySelectorAll(':scope > [class*="col-"]'));

  // Fallback: if no bootstrap col-* children found, use all direct element children.
  if (columns.length === 0) {
    columns = Array.from(rowEl.children).filter((c) => c.nodeType === 1);
  }

  // Build one cell per source column, preserving DOM order (handles both
  // text|image and image|text orderings). Each cell collects the meaningful
  // content of that column (image, or heading/paragraphs/links).
  const cells = columns
    .map((col) => {
      const content = [];

      // Image column: pull the picture/img.
      const pic = col.querySelector('picture');
      const img = col.querySelector('img');
      if (pic) {
        content.push(pic);
      } else if (img) {
        content.push(img);
      }

      // Text column: heading (skip if empty/whitespace), paragraphs, links.
      const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && heading.textContent.trim()) {
        content.push(heading);
      }

      // Paragraphs (which contain the body copy and the bold links).
      const paragraphs = Array.from(col.querySelectorAll(':scope > p'));
      paragraphs.forEach((p) => {
        if (p.textContent.trim() || p.querySelector('a, img, picture')) {
          content.push(p);
        }
      });

      // Fallback: standalone links not wrapped in a <p>.
      if (paragraphs.length === 0) {
        const looseLinks = Array.from(col.querySelectorAll(':scope > a'));
        looseLinks.forEach((a) => content.push(a));
      }

      return content;
    })
    // Drop any empty columns so we don't emit blank cells.
    .filter((cell) => cell.length > 0);

  // Empty-block guard: nothing meaningful extracted.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Columns block: a single row, each extracted column becomes one cell.
  const tableRows = [cells];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-feature',
    cells: tableRows,
  });
  element.replaceWith(block);
}
