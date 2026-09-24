import { expect, test } from '@playwright/test';
import { createRoutine, finishWorkout, logSet, nav, signIn, signUp, startRoutine } from './helpers';

test('an active workout survives a reload and can be resumed from Inicio', async ({ page }) => {
  await signUp(page);
  await createRoutine(page, 'Pierna', ['Sentadilla', 'Prensa']);
  await startRoutine(page, 'Pierna');
  await logSet(page, { weight: '100', reps: '5', rir: 2 });
  await page.getByRole('button', { name: /Siguiente: Prensa/ }).click();
  // Half-typed draft on the second exercise
  await page.getByLabel('Peso (kg)').fill('180');

  // "Close" the app: full reload, then land on Inicio
  await page.goto('/');
  const continueCard = page.getByRole('link', { name: /Continuar entrenamiento/ });
  await expect(continueCard).toBeVisible();
  await expect(continueCard).toContainText('Pierna');
  await continueCard.click();

  // Back exactly where we were: same exercise, same draft, logged set kept
  await expect(page.getByRole('heading', { name: 'Prensa' })).toBeVisible();
  await expect(page.getByLabel('Peso (kg)')).toHaveValue('180');
  await page.getByRole('button', { name: /^Sentadilla/ }).click();
  await expect(page.getByRole('button', { name: /Serie 1: 100 kg × 5/ })).toContainText('RIR 2');
});

test('cannot finish an empty workout; discarding needs explicit confirmation', async ({ page }) => {
  await signUp(page);
  await createRoutine(page, 'Brazo', ['Curl']);
  await startRoutine(page, 'Brazo');
  await page.getByRole('button', { name: 'Finalizar' }).click();
  await expect(page.getByRole('dialog', { name: 'No hay series registradas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finalizar y guardar' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Seguir entrenando' }).click();

  await logSet(page, { weight: '15', reps: '12' });
  // Validation: negative weight is rejected and nothing is saved
  await page.getByLabel('Peso (kg)').fill('-5');
  await page.getByRole('button', { name: 'Registrar serie 2' }).click();
  await expect(page.getByText('El peso debe ser un número mayor o igual a 0')).toBeVisible();
  await expect(page.locator('.set-row')).toHaveCount(1);

  // Editing and deleting a set
  await page.getByRole('button', { name: /Serie 1: 15 kg × 12/ }).click();
  const editor = page.locator('.card', { hasText: 'Editar serie 1' });
  await editor.getByLabel('Reps').fill('11');
  await editor.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: /Serie 1: 15 kg × 11/ })).toBeVisible();

  await page.getByRole('button', { name: 'Descartar entrenamiento' }).click();
  const discard = page.getByRole('button', { name: 'Descartar definitivamente' });
  await expect(discard).toBeDisabled();
  await page.getByLabel('Entiendo que se borrarán las series registradas.').check();
  await discard.click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Continuar entrenamiento/ })).toHaveCount(0);
  await nav(page, 'Historial');
  await expect(page.getByText('Aquí aparecerán tus entrenamientos terminados.')).toBeVisible();
});

test('logs a workout offline and syncs it when the connection returns', async ({
  page,
  context,
  browser,
}) => {
  const email = await signUp(page);
  await createRoutine(page, 'Torso', ['Dominadas', 'Remo']);
  // Let the service worker take control so the app shell is available offline.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Rutinas' })).toBeVisible();

  await context.setOffline(true);
  await startRoutine(page, 'Torso');
  await expect(page.getByText(/Sin conexión/)).toBeVisible();
  await logSet(page, { weight: '10', reps: '8' });
  await logSet(page, { weight: '10', reps: '7', rir: 1 });

  // Reload while offline: the service worker serves the app, Firestore serves its local cache.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dominadas' })).toBeVisible();
  await expect(page.locator('.set-row')).toHaveCount(2);
  await finishWorkout(page);
  await expect(page.getByRole('listitem', { name: 'Dominadas' })).toContainText('10 kg × 7');

  // Back online: pending writes are pushed to the server.
  await context.setOffline(false);
  await expect(page.getByText(/Sincronizando|Sin conexión/)).toHaveCount(0, { timeout: 20_000 });

  // A brand-new device (empty cache) sees the synced workout from the server.
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await signIn(page2, email);
  await nav(page2, 'Historial');
  await page2.getByRole('link', { name: /^Torso,/ }).click();
  const row = page2.getByRole('listitem', { name: 'Dominadas' });
  await expect(row.getByRole('row')).toHaveCount(3);
  await expect(row).toContainText('10 kg × 7');
  await other.close();
});

test('mobile navigation and the workout focus mode', async ({ page }) => {
  await signUp(page);
  for (const [name, heading] of [
    ['Rutinas', 'Rutinas'],
    ['Historial', 'Historial'],
    ['Progreso', 'Progreso'],
    ['Inicio', 'Inicio'],
  ] as const) {
    await nav(page, name);
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/entrenamiento/);
  }
  await createRoutine(page, 'Full', ['Peso muerto']);
  await startRoutine(page, 'Full');
  // No bottom navigation while training
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toHaveCount(0);
  // No horizontal scroll on a phone viewport
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await logSet(page, { weight: '140', reps: '3' });
  await finishWorkout(page);
});

test('PWA: manifest, icons and service worker are served', async ({ page, request }) => {
  const manifestRes = await request.get('/manifest.webmanifest');
  expect(manifestRes.ok()).toBe(true);
  const manifest = await manifestRes.json();
  expect(manifest).toMatchObject({
    short_name: 'FitnessApp',
    display: 'standalone',
    start_url: '/',
    theme_color: '#0e1116',
  });
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(`/${icon.src}`)).ok()).toBe(true);
  }
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest/);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
  // SPA deep links resolve (served by the SW navigation fallback / Hosting rewrite)
  await page.goto('/progreso');
  await expect(page.locator('#root')).not.toBeEmpty();
});
