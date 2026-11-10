import { test, expect, youtubeStub } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('aboutShown', 'true'));
  await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: youtubeStub }));
});

async function start(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'press any key to start' }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__yt?.state)).toBe(1);
}

test('initial screen uses the original local background, font and CRT', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'press any key to start' })).toBeVisible();
  await expect(page.locator('.scene').first()).toHaveAttribute('src', '/assets/gifs/2yzgWbRc97QOIUpklz.gif');
  await expect.poll(() => page.locator('.scene').first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.locator('#crt-lines')).toBeVisible();
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('VT323');
  await page.keyboard.press('a');
  await expect(page.getByRole('navigation')).toBeVisible();
  expect(errors).toEqual([]);
});

test('play/pause, volume, previous/next, shuffle and one persistent player', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.locator('main').click({ position: { x: 15, y: 100 } });
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#stations-button')).toContainText('beats to study/relax');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#stations-button')).toContainText('Chillhop Radio');
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('slider', { name: 'Volume' })).toHaveValue('0.8');
  await expect.poll(() => page.evaluate(() => (window as any).__yt.volume)).toBe(80);
  await page.getByRole('button', { name: 'Shuffle', exact: true }).click();
  await expect(page.locator('#stations-button')).not.toContainText('Chillhop Radio');
  expect(await page.evaluate(() => (window as any).__yt.instances)).toBe(1);
});

test('station gallery, external links, focus trap and Escape', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'change station', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.station-choice')).toHaveCount(10);
  await expect(dialog.getByRole('link')).toHaveCount(10);
  await expect(dialog.locator('[aria-pressed=true]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'change station', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'change station', exact: true }).click();
  await dialog.getByRole('button', { name: 'Coffee Shop Radio - 24/7 Chill Lo-Fi & Jazzy Beats', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#stations-button')).toHaveText('Coffee Shop Radio - 24/7 Chill Lo-Fi & Jazzy Beats');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('currentStationId')!))).toBe('blAFxjhg62k');
});

test('persisted settings, URL station, backgrounds, low-power and original video', async ({ page }) => {
  await start(page);
  await page.locator('main').click({ position: { x: 15, y: 100 } });
  const old = await page.locator('.scene').first().getAttribute('src');
  await page.keyboard.press('g');
  await expect(page.locator('.scene').first()).not.toHaveAttribute('src', old!);
  await page.keyboard.press('l');
  await expect(page.locator('main')).toHaveClass(/low-energy/);
  await expect(page.locator('#crt-lines')).toBeHidden();
  await page.keyboard.press('v');
  await expect(page.locator('.yt-wrapper')).toHaveClass(/shown/);
  await page.keyboard.press('ArrowDown');
  await page.reload();
  await page.getByRole('button', { name: 'press any key to start' }).click();
  await expect(page.locator('main')).toHaveClass(/low-energy/);
  await expect(page.getByRole('slider', { name: 'Volume' })).toHaveValue('0.6');
  await page.goto('/?station=UedTcufyrHc');
  await page.getByRole('button', { name: 'press any key to start' }).click();
  await expect(page.locator('#stations-button')).toContainText('ChillSynth FM');
  await page.goto('/?station=unknown');
  await page.getByRole('button', { name: 'press any key to start' }).click();
  await expect(page.locator('#stations-button')).toContainText('Chillhop Radio');
});

test('About keeps credits, omits the subscription form and supports disabled shortcuts', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'About', exact: true }).click();
  const about = page.getByRole('region', { name: 'About and keyboard shortcuts' });
  await expect(about).toBeVisible();
  await expect(about.getByRole('img')).toHaveCount(2);
  await expect(about.getByRole('link', { name: /@linuz90/ })).toBeVisible();
  await expect(about.locator('form, input[type="email"]')).toHaveCount(0);
  const old = await page.locator('.scene').first().getAttribute('src');
  await page.getByRole('checkbox', { name: 'Disable keyboard shortcuts' }).check();
  await page.locator('main').click({ position: { x: 15, y: 100 } });
  await page.keyboard.press('g');
  await expect(page.locator('.scene').first()).toHaveAttribute('src', old!);
  await page.getByRole('button', { name: 'Pomodoro Timer', exact: true }).click();
  await expect(about).toHaveCount(0);
});

test('Pomodoro start, pause, continue, stop, +5 and work/break transitions', async ({ page }) => {
  await start(page);
  await page.clock.install();
  await page.getByRole('button', { name: 'Pomodoro Timer', exact: true }).click();
  const timer = page.getByRole('region', { name: 'Pomodoro Timer' });
  await expect(page.getByRole('timer')).toHaveText('25:00');
  await timer.getByRole('button', { name: 'Start', exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.getByRole('timer')).toHaveText('24:57');
  await timer.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.runFor(2000);
  await expect(page.getByRole('timer')).toHaveText('24:57');
  await timer.getByRole('button', { name: 'Continue', exact: true }).click();
  await timer.getByRole('button', { name: '+5:00', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('29:57');
  await timer.getByRole('button', { name: 'Pause', exact: true }).click();
  await timer.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('25:00');
  await timer.getByRole('button', { name: 'Start', exact: true }).click();
  await page.clock.fastForward(1500000);
  await expect(page.getByRole('timer')).toHaveText('05:00');
  await expect(page.getByRole('timer')).toHaveClass('blue');
  await timer.getByRole('button', { name: 'Start', exact: true }).click();
  await page.clock.fastForward(300000);
  await expect(page.getByRole('timer')).toHaveText('25:00');
});

test('unplayable streams auto-skip; autoplay blocking has a working Play action', async ({ page }) => {
  await start(page);
  await page.evaluate(() => (window as any).__player.block());
  await expect(page.getByRole('status')).toContainText('Autoplay blocked');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.clock.install();
  await page.evaluate(() => (window as any).__player.fail(150));
  await expect(page.getByRole('status')).toContainText('Skipping it');
  await page.clock.runFor(4200);
  await expect(page.locator('#stations-button')).not.toContainText('Chillhop Radio');
});

test('all unavailable streams stop after one pass instead of looping forever', async ({ page }) => {
  await start(page);
  await page.clock.install();
  const visited = new Set<string>();
  for (let i = 0; i < 10; i++) {
    visited.add(await page.evaluate(() => (window as any).__yt.id));
    await page.evaluate(() => (window as any).__player.fail(150));
    if (i < 9) await page.clock.runFor(4200);
  }
  expect(visited.size).toBe(10);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('No stations available');
  const last = await page.evaluate(() => (window as any).__yt.id);
  await page.clock.runFor(10000);
  expect(await page.evaluate(() => (window as any).__yt.id)).toBe(last);
});

test('YouTube network failure is reported without breaking local controls', async ({ page }) => {
  await page.unroute('https://www.youtube.com/iframe_api');
  await page.route('https://www.youtube.com/iframe_api', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'press any key to start' }).click();
  await expect(page.getByRole('status')).toContainText('YouTube is unavailable');
  await page.getByRole('button', { name: 'change station', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('mobile layout has no overflow and the gallery stays usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.getByRole('button', { name: 'Fullscreen' })).toBeHidden();
  await page.getByRole('button', { name: 'change station', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Coffee Shop Radio - 24/7 Chill Lo-Fi & Jazzy Beats', exact: true }).click();
  await expect(page.locator('#stations-button')).toContainText('Coffee Shop Radio');
  const rect = await page.locator('.player-ui').boundingBox();
  expect(rect!.x).toBe(20);
  expect(rect!.x + rect!.width).toBe(370);
  expect(await page.locator('main').evaluate(el => [el.scrollLeft, el.scrollTop])).toEqual([0, 0]);
  await page.screenshot({ path: 'test-results/mobile.png' });
});

test('local presence counts real listening clients, not simulated visitors', async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    (window as any).__presence = Array.from({ length: 2 }, () => {
      const ws = new WebSocket(`ws://${location.host}/api/presence`);
      ws.onopen = () => ws.send(JSON.stringify({ listening: true }));
      return ws;
    });
  });
  await expect(page.locator('#visitors-counter')).toBeVisible();
  await expect(page.locator('#visitors-counter')).toContainText('listening now 3');
  await page.evaluate(() => (window as any).__presence.forEach((ws: WebSocket) => ws.close()));
  await expect(page.locator('#visitors-counter')).toHaveCount(0);
});

test('corrupt local settings cannot break the application', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('currentStationId', 'broken json');
    localStorage.setItem('playerVolume', 'null');
    localStorage.setItem('currentGifIndex', '9999');
  });
  await start(page);
  await expect(page.locator('#stations-button')).toContainText('Chillhop Radio');
  await expect(page.locator('.scene').first()).toHaveAttribute('src', '/assets/gifs/2yzgWbRc97QOIUpklz.gif');
});
