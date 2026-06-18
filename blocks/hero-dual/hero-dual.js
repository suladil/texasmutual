/**
 * Hero Dual — two-panel hero ("Texas Safe." / "Texas Strong.")
 *
 * Authored structure (.plain.html):
 *   .hero-dual > div(row) > [ imageCell (may be empty), textCell ]
 *   textCell contains: h1, p, h1, p  (Safe heading+copy, Strong heading+copy)
 *
 * Decorated output:
 *   .hero-dual > .hero-bg > .hero-content > [ .hero-col.texas-safe, .hero-col.texas-strong ]
 * The composite background image is applied via CSS on .hero-bg.
 */
export default function decorate(block) {
  // Find the cell that holds the headings/copy (image cell may be empty and in its own row).
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const textCell = cells.find((c) => c.querySelector('h1, h2, h3, p'));
  if (!textCell) return;
  const nodes = [...textCell.children];

  // Split into panels by heading boundaries.
  const panels = [];
  let current = null;
  nodes.forEach((node) => {
    if (/^H[1-6]$/.test(node.tagName)) {
      current = [];
      panels.push(current);
    }
    if (current) current.push(node);
  });
  // Fallback: if no heading boundaries detected, keep everything in one panel.
  if (panels.length === 0) panels.push(nodes);

  const variants = ['texas-safe', 'texas-strong'];

  const content = document.createElement('div');
  content.className = 'hero-content';

  panels.slice(0, 2).forEach((groupNodes, i) => {
    const col = document.createElement('div');
    col.className = `hero-col ${variants[i] || ''}`.trim();
    groupNodes.forEach((n) => col.append(n));
    content.append(col);
  });

  const bg = document.createElement('div');
  bg.className = 'hero-bg';
  bg.append(content);

  block.textContent = '';
  block.append(bg);
}
