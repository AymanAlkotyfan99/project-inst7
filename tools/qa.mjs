// Isolated browser verification. Pass an installed Playwright module as argv[2].
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
await mkdir('.qa', { recursive: true });
const eventOnly = process.argv[3] === 'event';
const results = eventOnly ? JSON.parse(await readFile('.qa/results.json', 'utf8')) : [];
const sizes = [[360, 800], [375, 812], [390, 844], [393, 873], [430, 932]];
const origin = process.env.QA_ORIGIN || 'http://localhost:5173';

async function observeStates(page) {
  await page.addInitScript(() => {
    window.qaStates = [];
    const record = () => {
      const next = document.body?.dataset.state;
      if (next && window.qaStates.at(-1) !== next) window.qaStates.push(next);
    };
    new MutationObserver(record).observe(document, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['data-state']
    });
  });
}

async function visibleIntroText(page) {
  return page.evaluate(() => {
    const root = document.getElementById('cinematic');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const visible = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text || node.parentElement.closest('script, style, title, desc')) continue;
      let paintable = true;
      for (let element = node.parentElement; element; element = element.parentElement) {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' ||
            Number(style.opacity) < 0.01 || element.hidden ||
            style.clipPath === 'inset(50%)' || style.clip === 'rect(0px, 0px, 0px, 0px)' ||
            element.classList.contains('sr-only')) {
          paintable = false;
          break;
        }
      }
      if (!paintable) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const bounds = range.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0 && bounds.right > 0 &&
          bounds.bottom > 0 && bounds.left < innerWidth && bounds.top < innerHeight) {
        visible.push(text);
      }
    }
    return visible;
  });
}

async function assertIntroHasNoText(page) {
  assert.deepEqual(await visibleIntroText(page), [], 'Nothing before the invitation should paint visible words');
}

try {
  if (!eventOnly) {
    for (const [width, height] of sizes) {
      const context = await browser.newContext({
        viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await observeStates(page);
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      await assertIntroHasNoText(page);
      assert.equal(await page.locator('.bride-layer, [src*="bride.webp"]').count(), 0, 'Bride is removed');
      assert.equal(await page.locator('video').count(), 0, 'The experience contains no video');
      const floralLoaded = await page.locator('.floral-arch').evaluate(element => {
        const image = element instanceof HTMLImageElement ? element : element.querySelector('img');
        return Boolean(image?.complete && image.naturalWidth > 0);
      });
      assert(floralLoaded, 'The entrance has a loaded floral asset');
      if (width === 390) await page.screenshot({ path: '.qa/mobile-entrance.png' });

      await page.waitForFunction(() => document.body.dataset.state === 'CARD_READY');
      await assertIntroHasNoText(page);
      const initial = await page.evaluate(() => {
        const card = document.getElementById('invitation-card').getBoundingClientRect();
        const anchor = document.querySelector('.card-anchor').getBoundingClientRect();
        const table = document.querySelector('.pedestal').getBoundingClientRect();
        const contact = document.querySelector('.pedestal-contact');
        return {
          scroll: getComputedStyle(document.body).overflow,
          card: { x: card.x, y: card.y, width: card.width, height: card.height, bottom: card.bottom },
          anchor: { x: anchor.x, width: anchor.width },
          table: { x: table.x, y: table.y, width: table.width },
          automaticallyPresented: document.body.classList.contains('card-presented'),
          shadowVisible: Number(getComputedStyle(contact).opacity) > 0,
          arabic: [...document.querySelectorAll('#invitation [data-bind]')].map(element => element.textContent)
        };
      });
      assert.equal(initial.scroll, 'hidden');
      assert(initial.card.x >= -1 && initial.card.x + initial.card.width <= width + 1, 'Envelope fits the mobile width');
      assert(initial.card.y >= 0 && initial.card.bottom <= height, 'Envelope fits the mobile height');
      assert(Math.abs(initial.anchor.x + initial.anchor.width / 2 - width / 2) < 3, 'Envelope anchor is centered while the physical card tilts');
      assert(Math.abs(initial.table.x + initial.table.width / 2 - width / 2) < 2, 'Table remains centered');
      assert(initial.automaticallyPresented, 'Envelope rises gently before the first user tap');
      assert(initial.shadowVisible, 'Table contact shadow remains present');
      assert(initial.arabic.includes('\u0622\u0644\u0627\u0621') && initial.arabic.includes('\u064a\u0627\u0633\u0631'), 'The invitation contains the correct joined Arabic names');
      await page.evaluate(() => scrollTo(0, 400));
      assert.equal(await page.evaluate(() => scrollY), 0, 'Scroll remains locked before entry');
      if (width === 390) await page.screenshot({ path: '.qa/mobile-card-ready.png' });

      const card = page.locator('#invitation-card');
      await card.tap();
      // Subsequent rapid/double taps must not restart opening or skip a phase.
      for (let index = 0; index < 5; index += 1) {
        await page.touchscreen.tap(width / 2, initial.card.y + initial.card.height / 2);
      }
      await page.waitForFunction(() => document.body.dataset.state === 'CARD_OPEN');
      await assertIntroHasNoText(page);
      const opened = await page.evaluate(() => {
        const inside = document.querySelector('.card-back').getBoundingClientRect();
        const glow = document.querySelector('.card-light');
        const flap = document.querySelector('.envelope-flap');
        return {
          inside: { x: inside.x, width: inside.width },
          glow: glow ? Number(getComputedStyle(glow).opacity) : 0,
          flapTransform: flap ? getComputedStyle(flap).transform : 'none',
          isOpened: document.body.classList.contains('card-opened'),
          sceneScroll: {
            x: document.getElementById('cinematic').scrollLeft,
            y: document.getElementById('cinematic').scrollTop
          },
          scroll: getComputedStyle(document.body).overflow
        };
      });
      assert(opened.inside.x >= -2 && opened.inside.x + opened.inside.width <= width + 2, 'Open paper fits mobile');
      assert(opened.glow > 0, 'Light emerges from the open envelope');
      assert(opened.flapTransform !== 'none', 'Envelope flap physically hinges open');
      assert(opened.isOpened);
      assert.deepEqual(opened.sceneScroll, { x: 0, y: 0 }, 'Opening and focus must never scroll the cinematic layers');
      assert.equal(opened.scroll, 'hidden');
      if (width === 390) await page.screenshot({ path: '.qa/mobile-card-open.png' });

      await page.waitForFunction(() => document.body.dataset.state === 'INVITATION_ACTIVE');
      await page.waitForTimeout(1200);
      const sequence = await page.evaluate(() => window.qaStates);
      for (const phase of ['CARD_READY', 'CARD_OPENING', 'CARD_OPEN', 'ENTERING_CARD', 'INVITATION_ACTIVE']) {
        assert.equal(sequence.filter(value => value === phase).length, 1, `${phase} should occur exactly once despite repeated taps`);
      }
      assert(sequence.indexOf('CARD_OPEN') < sequence.indexOf('ENTERING_CARD'));
      assert(sequence.indexOf('ENTERING_CARD') < sequence.indexOf('INVITATION_ACTIVE'));
      assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), 'hidden');
      assert.equal(await page.locator('#invitation').getAttribute('inert'), null);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('#map-link').isVisible(), false);
      assert.equal(await page.locator('#save-date').isVisible(), false);
      if (width === 390) await page.screenshot({ path: '.qa/mobile-invitation.png' });
      await page.evaluate(() => scrollTo(0, innerHeight + 200));
      await page.waitForTimeout(500);
      assert((await page.evaluate(() => scrollY)) > 0);
      assert.deepEqual(errors, [], 'Page must have no console or runtime errors');
      results.push({ width, height, pass: true, errors, initial, opened, sequence });
      await context.close();
    }

    const reduced = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce'
    });
    const page = await reduced.newPage();
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.body.dataset.state === 'CARD_READY');
    await assertIntroHasNoText(page);
    await page.locator('#invitation-card').tap();
    await page.waitForFunction(() => document.body.dataset.state === 'INVITATION_ACTIVE');
    await page.locator('#replay').click();
    await page.waitForFunction(() => document.body.dataset.state === 'CARD_READY');
    assert.equal(await page.locator('#invitation').getAttribute('inert'), '');
    await assertIntroHasNoText(page);
    await page.locator('#skip-intro').click();
    assert.equal(await page.getAttribute('body', 'data-state'), 'INVITATION_ACTIVE');
    results.push({ reducedMotion: true, singleTapOpening: true, replay: true, skip: true });
    await reduced.close();

    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const wide = await desktop.newPage();
    await wide.goto(origin, { waitUntil: 'domcontentloaded' });
    await wide.waitForTimeout(500);
    await assertIntroHasNoText(wide);
    await wide.screenshot({ path: '.qa/desktop-entrance.png' });
    await wide.waitForFunction(() => document.body.dataset.state === 'CARD_READY');
    await wide.screenshot({ path: '.qa/desktop-card-ready.png' });
    await wide.locator('#skip-intro').click();
    await wide.waitForTimeout(1200);
    await wide.screenshot({ path: '.qa/desktop-invitation.png' });
    await wide.locator('#our-story').scrollIntoViewIfNeeded();
    await wide.waitForTimeout(1200);
    await wide.screenshot({ path: '.qa/desktop-story.png' });
    await desktop.close();
    results.push({ desktop: true });
  }

  const configured = await browser.newContext({
    viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', acceptDownloads: true
  });
  const eventPage = await configured.newPage();
  const source = await readFile('script.js', 'utf8');
  await eventPage.route('**/script.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: source.replace('date: null', 'date: "2027-06-18"')
      .replace('time: null', 'time: "19:30"')
      .replace('mapsUrl: null', 'mapsUrl: "https://maps.google.com/?q=Damascus"')
  }));
  await eventPage.goto(origin);
  await eventPage.locator('#skip-intro').click();
  await eventPage.locator('#countdown').waitFor({ state: 'visible' });
  assert.equal(await eventPage.locator('#countdown .countdown-value').count(), 4);
  assert.equal(await eventPage.locator('#map-link').getAttribute('href'), 'https://maps.google.com/?q=Damascus');
  const downloadPromise = eventPage.waitForEvent('download');
  await eventPage.locator('#save-date').click();
  const download = await downloadPromise;
  const ics = await readFile(await download.path(), 'utf8');
  assert(ics.includes('DTSTART:20270618T163000Z'), 'Calendar must convert Damascus 19:30 to UTC');
  assert(ics.includes('\u0622\u0644\u0627\u0621') && ics.includes('\u064a\u0627\u0633\u0631'));
  results.push({ configuredEvent: true, countdown: true, map: true, calendar: true });
  await configured.close();
} finally {
  await writeFile('.qa/results.json', JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results.map(({ initial, opened, sequence, ...rest }) => rest), null, 2));
