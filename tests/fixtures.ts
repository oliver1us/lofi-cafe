import { test as base, chromium, expect } from '@playwright/test';

// CDP permits running tests with the browser already provided by this workspace.
// With no endpoint, Playwright uses its own locally installed Chromium instead.
export const test = base.extend({
  browser: [async ({}, use) => {
    const browser = process.env.CDP_ENDPOINT
      ? await chromium.connectOverCDP(process.env.CDP_ENDPOINT)
      : await chromium.launch();
    await use(browser);
    await browser.close();
  }, { scope: 'worker' }],
  context: async ({ browser, viewport, locale }, use) => {
    const context = await browser.newContext({ viewport: viewport ?? undefined, locale });
    await use(context);
    await context.close();
  },
});
export { expect };

// Controlled adapter for deterministic interface tests; this does NOT validate real audio.
export const youtubeStub = `
(() => {
  window.__yt = { instances: 0, volume: 70, state: -1, id: '' };
  const states = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  class Player {
    constructor(el, options) {
      window.__yt.instances++;
      this.options = options;
      this.id = options.videoId;
      window.__yt.id = this.id;
      const iframe = document.createElement('iframe');
      iframe.title = 'YouTube test adapter';
      iframe.src = 'about:blank';
      el.replaceWith(iframe);
      this.iframe = iframe;
      window.__player = this;
      setTimeout(() => options.events.onReady({ target: this }), 0);
    }
    getVideoUrl() { return 'https://www.youtube.com/watch?v=' + this.id; }
    setVolume(value) { window.__yt.volume = value; }
    playVideo() { this.state(1); }
    pauseVideo() { this.state(2); }
    cueVideoById(id) { this.id = id; window.__yt.id = id; this.state(5); }
    loadVideoById(id) { this.id = id; window.__yt.id = id; this.state(1); }
    state(data) { window.__yt.state = data; this.options.events.onStateChange({ target: this, data }); }
    fail(code) { this.options.events.onError({ target: this, data: code }); }
    block() { this.options.events.onAutoplayBlocked({ target: this }); }
    destroy() { this.iframe.remove(); }
  }
  window.YT = { Player, PlayerState: states };
  window.onYouTubeIframeAPIReady?.();
})();
`;
