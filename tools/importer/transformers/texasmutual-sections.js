/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Texas Mutual section breaks + section metadata.
 *
 * Runs in afterTransform only. Inserts an <hr> before each section (except the
 * first) so EDS renders separate sections, and a Section Metadata block for any
 * section that defines a style.
 *
 * Section selectors verified against migration-work/cleaned.html and
 * tools/importer/page-templates.json (homepage template, 6 sections):
 *  - rc2  Hero            -> section.hero-section            (line 349; #HOME is the <main> wrapper)
 *  - rc3  Quick Links     -> section.quick-links             (line 426)
 *  - rc5  Community Fund.  -> section.full-width-section.py-3.py-md-3 (line 452)
 *  - rc7  Why Texas Mutual -> section.2-column-section ...:nth-of-type(3) (line 460)
 *  - rc9  Good for Texas  -> section.2-column-section ...:nth-of-type(4) (line 479)
 *  - rc11 Texans Get It   -> section.2-column-section ...:nth-of-type(5) (line 493)
 *
 * None of the sections define a `style`, so no Section Metadata blocks are
 * expected; logic is kept generic so it works if styles are added later.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const document = element.ownerDocument;
    const sections = (payload && payload.template && payload.template.sections) || [];

    // Resolve the first DOM element for a section from its template selector(s).
    // The hero section (#HOME) is the <main> wrapper, so target its inner
    // section.hero-section instead of the wrapper itself.
    // Escape CSS class tokens whose name starts with a digit (e.g.
    // ".2-column-section"), which is invalid in an unescaped selector. Replace
    // each ".<token>" with a CSS.escape-safe equivalent so querySelector accepts
    // it. The TM 2-column sections use the class "2-column-section".
    const escapeSelector = (sel) => sel.replace(/\.([0-9][\w-]*)/g, (m, cls) => {
      const first = cls.charCodeAt(0).toString(16);
      return `.\\${first} ${cls.slice(1)}`;
    });

    const normalizeSelector = (raw) => {
      let sel = raw === '#HOME' ? 'section.hero-section' : raw;
      // page-structure selectors are body-scoped; element here is the content
      // root (document.body during validation), so strip a leading "body > ".
      return sel.replace(/^body\s*>\s*/, '');
    };

    // The three 2-column feature sections share an identical class and are
    // disambiguated in page-templates only by a trailing :nth-of-type(N).
    // querySelector rejects ".2-column-section:nth-of-type(N)" here, and the
    // literal N (3,4,5) counts sibling <section>s on the original page, not the
    // index within the matched class set. So map each distinct N for a given
    // base selector to its relative rank (smallest N -> occurrence 0, etc.).
    const nthRankByBase = {};
    sections.forEach((section) => {
      let selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      selectors.forEach((raw) => {
        if (!raw) return;
        const sel = normalizeSelector(raw);
        const nth = sel.match(/:nth-of-type\((\d+)\)\s*$/);
        if (!nth) return;
        const base = sel.replace(/:nth-of-type\(\d+\)\s*$/, '');
        (nthRankByBase[base] = nthRankByBase[base] || new Set()).add(parseInt(nth[1], 10));
      });
    });
    const rankOf = (base, n) => Array.from(nthRankByBase[base]).sort((a, b) => a - b).indexOf(n);

    const resolveSectionEl = (section) => {
      let selectors = section.selector;
      if (!Array.isArray(selectors)) selectors = [selectors];
      for (let raw of selectors) {
        if (!raw) continue;
        const sel = normalizeSelector(raw);

        const nth = sel.match(/:nth-of-type\((\d+)\)\s*$/);
        if (nth) {
          const base = escapeSelector(sel.replace(/:nth-of-type\(\d+\)\s*$/, ''));
          const rawBase = sel.replace(/:nth-of-type\(\d+\)\s*$/, '');
          const all = Array.from(element.querySelectorAll(base));
          const idx = rankOf(rawBase, parseInt(nth[1], 10));
          if (idx >= 0 && idx < all.length) return all[idx];
          continue;
        }

        const el = element.querySelector(escapeSelector(sel));
        if (el) return el;
      }
      return null;
    };

    // Process in reverse so inserted nodes don't shift earlier matches.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = resolveSectionEl(section);
      if (!sectionEl) continue;

      // Section Metadata block for sections that declare a style.
      if (section.style) {
        const meta = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(meta);
      }

      // Section break before every section except the first.
      if (i > 0) {
        const hr = document.createElement('hr');
        sectionEl.before(hr);
      }
    }
  }
}
