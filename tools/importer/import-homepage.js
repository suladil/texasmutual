/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroDualParser from './parsers/hero-dual.js';
import cardsQuicklinkParser from './parsers/cards-quicklink.js';
import columnsFeatureParser from './parsers/columns-feature.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/texasmutual-cleanup.js';
import sectionsTransformer from './transformers/texasmutual-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-dual': heroDualParser,
  'cards-quicklink': cardsQuicklinkParser,
  'columns-feature': columnsFeatureParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Texas Mutual homepage with hero, quick links, community funding callout, and alternating two-column feature sections',
  urls: [
    'https://www.texasmutual.com/',
  ],
  blocks: [
    {
      name: 'hero-dual',
      instances: ['#HOME', 'section.hero-section'],
    },
    {
      name: 'cards-quicklink',
      instances: ['section.quick-links'],
    },
    {
      name: 'columns-feature',
      instances: ['section[class~="2-column-section"]'],
    },
  ],
  sections: [
    {
      id: 'rc2',
      name: 'Hero',
      selector: ['#HOME', 'section.hero-section'],
      style: null,
      blocks: ['hero-dual'],
      defaultContent: [],
    },
    {
      id: 'rc3',
      name: 'Quick Links',
      selector: 'section.quick-links',
      style: null,
      blocks: ['cards-quicklink'],
      defaultContent: [],
    },
    {
      id: 'rc5',
      name: 'Community Funding',
      selector: 'section.full-width-section.py-3.py-md-3',
      style: null,
      blocks: [],
      defaultContent: [
        'section.full-width-section.py-3.py-md-3 h2',
        'section.full-width-section.py-3.py-md-3 p',
      ],
    },
    {
      id: 'rc7',
      name: 'Feature - Why Texas Mutual',
      selector: 'section.2-column-section.py-3.py-md-2:nth-of-type(3)',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: [],
    },
    {
      id: 'rc9',
      name: 'Feature - Good for Texas',
      selector: 'section.2-column-section.py-3.py-md-2:nth-of-type(4)',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: [],
    },
    {
      id: 'rc11',
      name: 'Feature - Texans Get It',
      selector: 'section.2-column-section.py-3.py-md-2:nth-of-type(5)',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, then section breaks/metadata
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
        return;
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return; // de-dupe across overlapping selectors
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path: path || '/index',
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
