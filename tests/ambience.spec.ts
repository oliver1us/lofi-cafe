import { test, expect, youtubeStub } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: youtubeStub }));
  await page.addInitScript(() => {
    localStorage.setItem('aboutShown', 'true');
    const NativeContext = window.AudioContext;
    (window as any).__ambientContexts = [];
    window.AudioContext = class extends NativeContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        (window as any).__ambientContexts.push(this);
      }
      createGain() {
        const gain = super.createGain();
        if (!(this as any).__master) (this as any).__master = gain;
        return gain;
      }
    };
  });
});

async function openMixer(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'press any key to start' }).click();
  await page.getByRole('button', { name: 'Ambient sounds', exact: true }).click();
  return page.getByRole('region', { name: 'Ambient sounds', exact: true });
}

test('mixes real audio independently, saves levels, mutes and resumes', async ({ page }) => {
  const mixer = await openMixer(page);
  await expect(mixer.getByRole('slider')).toHaveCount(6);
  expect(await page.evaluate(() => (window as any).__ambientContexts.length)).toBe(0);
  for (const name of ['Rain', 'Ocean', 'Wind', 'Forest', 'River', 'Fire']) {
    await mixer.getByRole('button', { name, exact: true }).click();
    await expect(mixer.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  expect(await page.evaluate(() => (window as any).__ambientContexts.length)).toBe(1);
  await expect(mixer.getByRole('status')).toHaveText('6 sounds selected');
  await mixer.getByRole('slider', { name: 'Rain volume', exact: true }).fill('0.62');
  await expect(mixer.getByRole('slider', { name: 'Rain volume', exact: true })).toHaveValue('0.62');

  // Sample the actual Web Audio graph, not a stubbed play() call.
  await page.evaluate(() => {
    const context = (window as any).__ambientContexts[0];
    const analyser = context.createAnalyser();
    context.__master.connect(analyser);
    (window as any).__ambientLevel = () => {
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      return Math.sqrt(samples.reduce((sum: number, n: number) => sum + n * n, 0) / samples.length);
    };
  });
  await expect.poll(() => page.evaluate(() => (window as any).__ambientLevel())).toBeGreaterThan(0.001);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__ambientLevel())).toBeGreaterThan(0.001);
  await mixer.getByRole('button', { name: 'Mute all sounds' }).click();
  await expect(mixer.getByRole('status')).toHaveText('Sounds muted');
  await expect.poll(() => page.evaluate(() => (window as any).__ambientContexts[0].state)).toBe('suspended');
  await mixer.getByRole('button', { name: 'Resume sounds' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__ambientContexts[0].state)).toBe('running');
  await page.keyboard.press('Escape');
  await expect(mixer).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ambient sounds', exact: true })).toBeFocused();
  await expect.poll(() => page.evaluate(() => (window as any).__ambientLevel())).toBeGreaterThan(0.001);

  await page.reload();
  await page.getByRole('button', { name: 'press any key to start' }).click();
  await page.getByRole('button', { name: 'Ambient sounds', exact: true }).click();
  await expect(mixer.getByRole('button', { name: 'Rain', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(mixer.getByRole('slider', { name: 'Rain volume', exact: true })).toHaveValue('0.62');
  expect(await page.evaluate(() => (window as any).__ambientContexts.length)).toBe(0);
  await mixer.getByRole('button', { name: 'Resume sounds' }).click();
  await expect(mixer.getByRole('status')).toHaveText('6 sounds selected');
});

test('mobile mixer scrolls without overflow and range keys do not change music', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  const mixer = await openMixer(page);
  const slider = mixer.getByRole('slider', { name: 'Rain volume', exact: true });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('0.36');
  await expect(page.locator('#stations-button')).toContainText('Chillhop Radio');
  await mixer.getByRole('button', { name: 'Fire', exact: true }).click();
  await expect(mixer.getByRole('button', { name: 'Fire', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const bounds = await mixer.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThan(667);
  await page.screenshot({ path: 'test-results/ambient-mobile.png' });
});

test('malformed preferences and unavailable audio are handled safely', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ambientMix', JSON.stringify({ rain: { enabled: 'true', volume: 'loud' }, ocean: null, wind: { enabled: true, volume: 90 } }));
    window.AudioContext = class { constructor() { throw new Error('Audio unavailable'); } } as any;
  });
  const mixer = await openMixer(page);
  await expect(mixer.getByRole('button', { name: 'Rain', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(mixer.getByRole('slider', { name: 'Rain volume', exact: true })).toHaveValue('0.35');
  await expect(mixer.getByRole('slider', { name: 'Wind volume', exact: true })).toHaveValue('1');
  await mixer.getByRole('button', { name: 'Rain', exact: true }).click();
  await expect(mixer.getByRole('alert')).toContainText('Ambient audio could not start');
  await expect(mixer.getByRole('button', { name: 'Resume sounds' })).toBeVisible();
});
