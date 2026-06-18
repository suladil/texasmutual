import { getMetadata } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer fragment: localhost (aem up) first, then DA/EDS production
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return;

  const html = await resp.text();
  const fragment = document.createElement('div');
  fragment.innerHTML = html;

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // assign section classes: top-bar, links, bottom
  const classes = ['top-bar', 'links', 'bottom'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${c}`);
  });

  // mark the brand/logo column in the links row
  const links = footer.querySelector('.footer-links');
  if (links) {
    const brand = links.querySelector(':scope > p');
    if (brand && brand.querySelector('img')) brand.classList.add('footer-brand');
  }

  // build the newsletter subscribe form (controls live in JS, not the fragment)
  const bottom = footer.querySelector('.footer-bottom');
  if (bottom) {
    const cols = bottom.querySelectorAll(':scope > div');
    const subscribeCol = cols[cols.length - 1];
    if (subscribeCol) {
      subscribeCol.classList.add('footer-subscribe');
      const intro = subscribeCol.querySelector('p');
      const form = document.createElement('form');
      form.className = 'footer-newsletter';
      form.setAttribute('aria-label', 'Newsletter signup');
      form.innerHTML = `
        <input type="email" name="email" aria-label="Email" placeholder="Email" required>
        <button type="submit">Subscribe</button>`;
      // place the form above the intro paragraph
      if (intro) subscribeCol.insertBefore(form, intro);
      else subscribeCol.prepend(form);
    }
  }

  block.append(footer);
}
