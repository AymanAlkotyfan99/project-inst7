// Isolated browser verification. Pass an installed Playwright module as argv[2].
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
await mkdir('.qa', { recursive: true });
const results = process.argv[3]==='event' ? JSON.parse(await readFile('.qa/results.json','utf8')) : [];
const sizes = [[360,800],[375,812],[390,844],[393,873],[430,932]];
try {
  if (process.argv[3]!=='event') {
  for (const [width,height] of sizes) {
    const context = await browser.newContext({ viewport:{width,height}, isMobile:true, hasTouch:true, deviceScaleFactor:1 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if(m.type()==='error') errors.push(m.text()); });
    await page.goto('http://localhost:5173', {waitUntil:'domcontentloaded'});
    if(width===390) { await page.waitForTimeout(500); await page.screenshot({path:'.qa/mobile-entrance.png'}); }
    await page.waitForFunction(() => document.body.dataset.state==='CARD_READY');
    const initial = await page.evaluate(() => {
      const card=document.getElementById('invitation-card').getBoundingClientRect();
      const pedestal=document.querySelector('.pedestal').getBoundingClientRect();
      return { scroll: getComputedStyle(document.body).overflow, card:{x:card.x,y:card.y,width:card.width,height:card.height,bottom:card.bottom}, pedestal:{x:pedestal.x,y:pedestal.y,width:pedestal.width}, arabic:[...document.querySelectorAll('[data-bind]')].map(e=>e.textContent), video:document.querySelectorAll('video').length };
    });
    assert.equal(initial.scroll,'hidden');
    assert.equal(initial.video,0);
    assert(initial.card.x>=0 && initial.card.x+initial.card.width<=width);
    assert(Math.abs(initial.pedestal.x+initial.pedestal.width/2-width/2)<2);
    assert(Math.abs(initial.card.bottom-initial.pedestal.y)<20);
    assert(initial.arabic.includes('آلاء') && initial.arabic.includes('ياسر') && initial.arabic.includes('آ') && initial.arabic.includes('ي'));
    if(width===390) await page.screenshot({path:'.qa/mobile-card-ready.png'});
    const card=page.locator('#invitation-card');
    await card.tap();
    // Pointer/touch burst at the original card location must not open it.
    for(let i=0;i<5;i++) await page.touchscreen.tap(width/2,initial.card.y+initial.card.height/2);
    await page.waitForTimeout(1250);
    assert.equal(await page.getAttribute('body','data-state'),'CARD_LIFTED');
    assert.equal(await card.isEnabled(),true);
    if(width===390) await page.screenshot({path:'.qa/mobile-card-lifted.png'});
    await card.tap();
    await page.waitForFunction(()=>document.body.dataset.state==='CARD_OPEN');
    if(width===390) await page.screenshot({path:'.qa/mobile-card-open.png'});
    const spread=await page.locator('.card-back').boundingBox();
    assert(spread.x>=0 && spread.x+spread.width<=width+2,'Open inside should fit mobile');
    await page.waitForFunction(()=>document.body.dataset.state==='INVITATION_ACTIVE');
    await page.waitForTimeout(1200);
    assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');
    assert.equal(await page.locator('#invitation').getAttribute('inert'),null);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await page.locator('#map-link').isVisible(),false);
    assert.equal(await page.locator('#save-date').isVisible(),false);
    if(width===390) await page.screenshot({path:'.qa/mobile-invitation.png'});
    await page.evaluate(()=>scrollTo(0,innerHeight+200));
    await page.waitForTimeout(500);
    assert((await page.evaluate(()=>scrollY))>0);
    assert.deepEqual(errors,[],'Page must have no console or runtime errors');
    results.push({width,height,pass:true,errors,initial});
    await context.close();
  }
  const reduced=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page=await reduced.newPage();
  await page.goto('http://localhost:5173',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.body.dataset.state==='CARD_READY');
  await page.locator('#invitation-card').tap();
  await page.waitForTimeout(350);
  await page.locator('#invitation-card').tap();
  assert.equal(await page.getAttribute('body','data-state'),'CARD_LIFTED');
  await page.waitForTimeout(700);
  await page.locator('#invitation-card').tap();
  await page.waitForFunction(()=>document.body.dataset.state==='INVITATION_ACTIVE');
  await page.locator('#replay').click();
  await page.waitForFunction(()=>document.body.dataset.state==='CARD_READY');
  assert.equal(await page.locator('#invitation').getAttribute('inert'),'');
  await page.locator('#skip-intro').click();
  assert.equal(await page.getAttribute('body','data-state'),'INVITATION_ACTIVE');
  results.push({reducedMotion:true,twoTapGate:true,replay:true,skip:true});
  await reduced.close();
  const desktop=await browser.newContext({viewport:{width:1440,height:1000}});
  const wide=await desktop.newPage();
  await wide.goto('http://localhost:5173',{waitUntil:'domcontentloaded'});
  await wide.waitForTimeout(400);
  await wide.screenshot({path:'.qa/desktop-entrance.png'});
  await wide.waitForFunction(()=>document.body.dataset.state==='CARD_READY');
  await wide.screenshot({path:'.qa/desktop-card-ready.png'});
  await wide.locator('#skip-intro').click();
  await wide.waitForTimeout(1200);
  await wide.screenshot({path:'.qa/desktop-invitation.png'});
  await wide.locator('#our-story').scrollIntoViewIfNeeded();
  await wide.waitForTimeout(1200);
  await wide.screenshot({path:'.qa/desktop-story.png'});
  await desktop.close();
  results.push({desktop:true});
  }
  const configured=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});
  const eventPage=await configured.newPage();
  const source=await readFile('script.js','utf8');
  await eventPage.route('**/script.js',route=>route.fulfill({contentType:'text/javascript',body:source.replace('date: null','date: "2027-06-18"').replace('time: null','time: "19:30"').replace('mapsUrl: null','mapsUrl: "https://maps.google.com/?q=Damascus"')}));
  await eventPage.goto('http://localhost:5173');
  await eventPage.locator('#skip-intro').click();
  await eventPage.locator('#countdown').waitFor({state:'visible'});
  assert.equal(await eventPage.locator('#countdown').isVisible(),true);
  assert.equal(await eventPage.locator('#countdown .countdown-value').count(),4);
  assert.equal(await eventPage.locator('#map-link').getAttribute('href'),'https://maps.google.com/?q=Damascus');
  const downloadPromise=eventPage.waitForEvent('download');
  await eventPage.locator('#save-date').click();
  const download=await downloadPromise;
  const ics=await readFile(await download.path(),'utf8');
  assert(ics.includes('DTSTART:20270618T163000Z'),'Calendar must convert Damascus 19:30 to UTC');
  assert(ics.includes('آلاء') && ics.includes('ياسر'));
  results.push({configuredEvent:true,countdown:true,map:true,calendar:true});
  await configured.close();
} finally {
  await writeFile('.qa/results.json',JSON.stringify(results,null,2));
  await browser.close();
}
console.log(JSON.stringify(results.map(({initial,...rest})=>rest),null,2));
