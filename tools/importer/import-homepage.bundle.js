/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-dual.js
  function parse(element, { document }) {
    const desktopRow = element.querySelector(".row.d-lg-block, .row.d-xl-block") || element;
    const bgImage = desktopRow.querySelector(".hero-bg img") || element.querySelector(".hero-bg img") || element.querySelector(".texas-safe img, .texas-strong img") || element.querySelector("img");
    const textNodes = [];
    const seen = /* @__PURE__ */ new Set();
    const collectDesktop = (panel) => {
      if (!panel) return;
      const candidates = panel.querySelectorAll(
        ":scope > h1.d-lg-block, :scope > h2.d-lg-block, :scope > h3.d-lg-block, :scope > p.d-lg-block, :scope > .d-none.d-lg-block h1, :scope > .d-none.d-lg-block h2, :scope > .d-none.d-lg-block h3, :scope > .d-none.d-lg-block p"
      );
      candidates.forEach((node) => {
        const txt = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (!txt) return;
        if (seen.has(txt)) return;
        seen.add(txt);
        textNodes.push(node);
      });
    };
    const safePanel = desktopRow.querySelector(".texas-safe") || element.querySelector(".texas-safe");
    const strongPanel = desktopRow.querySelector(".texas-strong") || element.querySelector(".texas-strong");
    collectDesktop(safePanel);
    collectDesktop(strongPanel);
    if (!textNodes.length) {
      element.querySelectorAll("h1, h2, h3, p").forEach((node) => {
        const txt = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (!txt || seen.has(txt)) return;
        seen.add(txt);
        textNodes.push(node);
      });
    }
    if (!bgImage && !textNodes.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const imageCell = document.createDocumentFragment();
    if (bgImage) {
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(bgImage);
    }
    const textCell = document.createDocumentFragment();
    if (textNodes.length) {
      textCell.appendChild(document.createComment(" field:text "));
      textNodes.forEach((node) => textCell.appendChild(node));
    }
    const cells = [
      [imageCell],
      [textCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-dual", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-quicklink.js
  function parse2(element, { document }) {
    let tiles = Array.from(element.querySelectorAll(":scope > a"));
    if (!tiles.length) {
      tiles = Array.from(element.querySelectorAll("a")).filter(
        (a) => a.querySelector('div.injury, div[style*="background-image"], img')
      );
    }
    const toAbsolute = (src) => {
      if (!src) return src;
      try {
        return new URL(src, document.baseURI || window.location.href).href;
      } catch (e) {
        return src;
      }
    };
    const getIconUrl = (tile) => {
      const img = tile.querySelector("img");
      if (img && img.getAttribute("src")) return toAbsolute(img.getAttribute("src"));
      const iconDiv = tile.querySelector('div.injury, div[style*="background-image"]');
      const style = iconDiv ? iconDiv.getAttribute("style") || "" : "";
      const match = style.match(/url\((['"]?)([^'")]+)\1\)/);
      return match ? toAbsolute(match[2]) : null;
    };
    const cells = [];
    tiles.forEach((tile) => {
      const href = tile.getAttribute("href");
      const iconUrl = getIconUrl(tile);
      const labelDiv = Array.from(tile.querySelectorAll(":scope > div")).find(
        (div) => div.textContent.trim() && !div.querySelector("img")
      );
      const labelText = (labelDiv ? labelDiv.textContent : tile.textContent).trim();
      if (!iconUrl && !labelText) return;
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (iconUrl) {
        const img = document.createElement("img");
        img.setAttribute("src", iconUrl);
        img.setAttribute("alt", labelText || "");
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (href) {
        const link = document.createElement("a");
        link.setAttribute("href", href);
        link.textContent = labelText;
        textCell.appendChild(link);
      } else {
        const p = document.createElement("p");
        p.textContent = labelText;
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-quicklink", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-feature.js
  function parse3(element, { document }) {
    const rowEl = element.querySelector(".row") || element;
    let columns = Array.from(rowEl.querySelectorAll(':scope > [class*="col-"]'));
    if (columns.length === 0) {
      columns = Array.from(rowEl.children).filter((c) => c.nodeType === 1);
    }
    const cells = columns.map((col) => {
      const content = [];
      const pic = col.querySelector("picture");
      const img = col.querySelector("img");
      if (pic) {
        content.push(pic);
      } else if (img) {
        content.push(img);
      }
      const heading = col.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading && heading.textContent.trim()) {
        content.push(heading);
      }
      const paragraphs = Array.from(col.querySelectorAll(":scope > p"));
      paragraphs.forEach((p) => {
        if (p.textContent.trim() || p.querySelector("a, img, picture")) {
          content.push(p);
        }
      });
      if (paragraphs.length === 0) {
        const looseLinks = Array.from(col.querySelectorAll(":scope > a"));
        looseLinks.forEach((a) => content.push(a));
      }
      return content;
    }).filter((cell) => cell.length > 0);
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const tableRows = [cells];
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns-feature",
      cells: tableRows
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/texasmutual-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        // doubleclick floodlight + flashtalking container iframes
        'img[src*="adnxs.com"]',
        'img[src*="mathtag.com"]',
        'img[src*="adsrvr.org"]',
        'img[src*="demdex.net"]',
        'img[src*="casalemedia.com"]',
        'img[src*="rlcdn.com"]',
        'img[src*="pubmatic.com"]',
        'img[src*="adgrx.com"]'
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "nav.navbar.navbar-expand-lg",
        // rc1 header navigation
        "footer.optional-footer",
        // rc13 pre-footer (For Agents/Providers/Injured Employees)
        "footer",
        // rc14 main footer (also covers footer.optional-footer if class ever drops)
        "link",
        "noscript",
        "source"
      ]);
      element.querySelectorAll("div").forEach((div) => {
        if (div.children.length === 0 && div.textContent.trim() === "" && !div.querySelector("img, picture, svg, iframe")) {
          div.remove();
        }
      });
    }
  }

  // tools/importer/transformers/texasmutual-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const document = element.ownerDocument;
      const sections = payload && payload.template && payload.template.sections || [];
      const escapeSelector = (sel) => sel.replace(/\.([0-9][\w-]*)/g, (m, cls) => {
        const first = cls.charCodeAt(0).toString(16);
        return `.\\${first} ${cls.slice(1)}`;
      });
      const normalizeSelector = (raw) => {
        let sel = raw === "#HOME" ? "section.hero-section" : raw;
        return sel.replace(/^body\s*>\s*/, "");
      };
      const nthRankByBase = {};
      sections.forEach((section) => {
        let selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        selectors.forEach((raw) => {
          if (!raw) return;
          const sel = normalizeSelector(raw);
          const nth = sel.match(/:nth-of-type\((\d+)\)\s*$/);
          if (!nth) return;
          const base = sel.replace(/:nth-of-type\(\d+\)\s*$/, "");
          (nthRankByBase[base] = nthRankByBase[base] || /* @__PURE__ */ new Set()).add(parseInt(nth[1], 10));
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
            const base = escapeSelector(sel.replace(/:nth-of-type\(\d+\)\s*$/, ""));
            const rawBase = sel.replace(/:nth-of-type\(\d+\)\s*$/, "");
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
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = resolveSectionEl(section);
        if (!sectionEl) continue;
        if (section.style) {
          const meta = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(meta);
        }
        if (i > 0) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-dual": parse,
    "cards-quicklink": parse2,
    "columns-feature": parse3
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Texas Mutual homepage with hero, quick links, community funding callout, and alternating two-column feature sections",
    urls: [
      "https://www.texasmutual.com/"
    ],
    blocks: [
      {
        name: "hero-dual",
        instances: ["#HOME", "section.hero-section"]
      },
      {
        name: "cards-quicklink",
        instances: ["section.quick-links"]
      },
      {
        name: "columns-feature",
        instances: ['section[class~="2-column-section"]']
      }
    ],
    sections: [
      {
        id: "rc2",
        name: "Hero",
        selector: ["#HOME", "section.hero-section"],
        style: null,
        blocks: ["hero-dual"],
        defaultContent: []
      },
      {
        id: "rc3",
        name: "Quick Links",
        selector: "section.quick-links",
        style: null,
        blocks: ["cards-quicklink"],
        defaultContent: []
      },
      {
        id: "rc5",
        name: "Community Funding",
        selector: "section.full-width-section.py-3.py-md-3",
        style: null,
        blocks: [],
        defaultContent: [
          "section.full-width-section.py-3.py-md-3 h2",
          "section.full-width-section.py-3.py-md-3 p"
        ]
      },
      {
        id: "rc7",
        name: "Feature - Why Texas Mutual",
        selector: "section.2-column-section.py-3.py-md-2:nth-of-type(3)",
        style: null,
        blocks: ["columns-feature"],
        defaultContent: []
      },
      {
        id: "rc9",
        name: "Feature - Good for Texas",
        selector: "section.2-column-section.py-3.py-md-2:nth-of-type(4)",
        style: null,
        blocks: ["columns-feature"],
        defaultContent: []
      },
      {
        id: "rc11",
        name: "Feature - Texans Get It",
        selector: "section.2-column-section.py-3.py-md-2:nth-of-type(5)",
        style: null,
        blocks: ["columns-feature"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
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
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path: path || "/index",
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
