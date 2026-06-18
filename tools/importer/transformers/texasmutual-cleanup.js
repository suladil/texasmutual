/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Texas Mutual site-wide cleanup.
 *
 * Removes non-authorable site shell / boilerplate so the import contains only
 * page-level authorable content. ALL selectors below were verified against
 * migration-work/cleaned.html for https://www.texasmutual.com/.
 *
 * Verified in captured DOM:
 *  - Tracking pixels at top of <body>: <img src="https://secure.adnxs.com/px...">,
 *    pixel.mathtag.com, insight.adsrvr.org (lines 2-4)
 *  - <iframe> tags: 9269992.fls.doubleclick.net floodlight, servedby.flashtalking.com
 *    container (lines 13-14, 19-20)
 *  - Header nav: <nav class="navbar navbar-expand-lg"> (rc1, line 21)
 *  - Pre-footer widget: <footer class="optional-footer"> (rc13, line 507)
 *  - Main footer: <footer> sibling (rc14, line 527)
 *  - Empty spacer <div></div> siblings (rc4, rc6, rc8, rc10, rc12) between sections
 *    (e.g. lines 449-450, 457-458, 490-491, 504-505) — marked by <!--Spacer--> comments
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Tracking pixels / analytics iframes can sit between sections and confuse
    // block parsing; remove before parsers run.
    WebImporter.DOMUtils.remove(element, [
      'iframe', // doubleclick floodlight + flashtalking container iframes
      'img[src*="adnxs.com"]',
      'img[src*="mathtag.com"]',
      'img[src*="adsrvr.org"]',
      'img[src*="demdex.net"]',
      'img[src*="casalemedia.com"]',
      'img[src*="rlcdn.com"]',
      'img[src*="pubmatic.com"]',
      'img[src*="adgrx.com"]',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome (auto-populated by EDS header/footer).
    WebImporter.DOMUtils.remove(element, [
      'nav.navbar.navbar-expand-lg', // rc1 header navigation
      'footer.optional-footer', // rc13 pre-footer (For Agents/Providers/Injured Employees)
      'footer', // rc14 main footer (also covers footer.optional-footer if class ever drops)
      'link',
      'noscript',
      'source',
    ]);

    // Remove empty spacer divs (rc4/rc6/rc8/rc10/rc12). These are siblings
    // directly under <main>/body with no element children and no text content.
    element.querySelectorAll('div').forEach((div) => {
      if (
        div.children.length === 0
        && div.textContent.trim() === ''
        && !div.querySelector('img, picture, svg, iframe')
      ) {
        div.remove();
      }
    });
  }
}
