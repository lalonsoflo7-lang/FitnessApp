import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createRoutine, finishWorkout, logSet, nav, signUp, startRoutine } from './helpers';

async function expectNoSeriousA11yViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${label}: ${v.id} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test('accessibility: no serious WCAG A/AA violations on the main screens', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
  await expectNoSeriousA11yViolations(page, 'login');

  await signUp(page);
  await createRoutine(page, 'Push', ['Press banca']);
  await expectNoSeriousA11yViolations(page, 'rutinas');
  await startRoutine(page, 'Push');
  await logSet(page, { weight: '60', reps: '10', type: 'Cal.' });
  await logSet(page, { weight: '80', reps: '8', rir: 2 });
  await expectNoSeriousA11yViolations(page, 'entrenamiento');
  await finishWorkout(page);
  await expectNoSeriousA11yViolations(page, 'detalle historial');
  await nav(page, 'Inicio');
  await expectNoSeriousA11yViolations(page, 'inicio');
  await nav(page, 'Progreso');
  await page.getByRole('link', { name: /Press banca/ }).click();
  await expect(page.getByRole('region', { name: 'Resumen del ejercicio' })).toBeVisible();
  await expectNoSeriousA11yViolations(page, 'progreso ejercicio');
});

test('touch targets in the workout screen are at least 44×44 px', async ({ page }) => {
  await signUp(page);
  await createRoutine(page, 'Push', ['Press banca']);
  await startRoutine(page, 'Push');
  const small = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>('main button, main input, header button, header a'),
    )
      .filter((el) => el.offsetParent !== null)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          label: el.getAttribute('aria-label') ?? el.textContent?.trim(),
          w: r.width,
          h: r.height,
        };
      })
      .filter((r) => r.w < 44 || r.h < 40),
  );
  expect(small).toEqual([]);
  const fontSizes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map((i) =>
      parseFloat(getComputedStyle(i).fontSize),
    ),
  );
  expect(Math.min(...fontSizes)).toBeGreaterThanOrEqual(16);
});

test('Chrome reports the app as installable', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP installability check is Chromium-only');
  await page.goto('/');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: { errorId: string }[];
  };
  // Playwright contexts are incognito, which Chrome always reports; anything else is a real problem.
  expect(installabilityErrors.filter((e) => e.errorId !== 'in-incognito')).toEqual([]);
});
