# Page Migration Plan — texasmutual.com Homepage (with Design)

## Overview
Migrate the Texas Mutual homepage (https://www.texasmutual.com/) to AEM Edge Delivery Services, including content structure AND matching the original visual design of the blocks.

## Source
- **Page URL:** https://www.texasmutual.com/
- **Scope:** Single page + design (content structure + visual styling match)

## Checklist

### 1. Setup & Discovery
- [ ] Confirm project type and available block library endpoint
- [ ] Scrape the source page (HTML, metadata, images)

### 2. Page Analysis
- [ ] Analyze page structure — identify sections and content sequences
- [ ] Determine authoring approach (default content vs. blocks) per section
- [ ] Identify block variants needed (reuse existing or create new)
- [ ] Produce analysis artifacts (structure JSON, screenshots, cleaned HTML)
- [ ] Capture navigation/header and footer for instrumentation

### 3. Block & Infrastructure Prep
- [ ] Map content sections to EDS blocks/variants
- [ ] Create any new block variants required
- [ ] Generate import infrastructure (block parsers, page transformers)
- [ ] Build the bundled import script

### 4. Content Import
- [ ] Run the import script to generate page content
- [ ] Verify content rendered correctly in preview

### 5. Design Migration
- [ ] Extract design tokens/computed styles from the original site
- [ ] Apply site-level design (typography, colors, spacing)
- [ ] Style each block to match the original page visually
- [ ] Migrate header/navigation and footer styling

### 6. Visual Validation
- [ ] Compare migrated page against the original (block + full-page)
- [ ] Fix styling discrepancies (iterate as needed)
- [ ] Final QA pass

## Notes
- This covers the homepage as a single page. If you later want similar pages treated as a shared template, that would be a separate "Full template" scope.
- Execution requires **Execute mode** — approve this plan to proceed.
