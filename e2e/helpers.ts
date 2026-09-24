import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'secret123';

export function uniqueEmail(prefix = 'atleta') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function signUp(page: Page, email = uniqueEmail()) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar correo y contraseña' }).click();
  await page
    .getByRole('group', { name: 'Modo' })
    .getByRole('button', { name: 'Crear cuenta' })
    .click();
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Registrarme' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  return email;
}

export async function signIn(page: Page, email: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar correo y contraseña' }).click();
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
}

export async function nav(page: Page, name: 'Inicio' | 'Rutinas' | 'Historial' | 'Progreso') {
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name })
    .click();
}

export async function createRoutine(page: Page, name: string, exercises: string[]) {
  await nav(page, 'Rutinas');
  await page.getByRole('link', { name: 'Nueva' }).click();
  await page.getByLabel('Nombre').fill(name);
  const search = page.getByPlaceholder('Buscar o crear ejercicio');
  for (const exercise of exercises) {
    await search.fill(exercise);
    await search.press('Enter');
    await expect(page.getByRole('list', { name: 'Orden de ejercicios' })).toContainText(exercise);
  }
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}

export async function startRoutine(page: Page, routine: string) {
  await nav(page, 'Inicio');
  await page.getByRole('button', { name: `Iniciar entrenamiento ${routine}` }).click();
  await expect(page.getByRole('button', { name: 'Finalizar' })).toBeVisible();
}

export type SetKind = 'Cal.' | 'Efectiva' | 'Drop';

export async function logSet(
  page: Page,
  set: { weight: string; reps: string; type?: SetKind; rir?: number },
) {
  const before = await page.locator('.set-row').count();
  await page.getByLabel('Peso (kg)').fill(set.weight);
  await page.getByLabel('Reps').fill(set.reps);
  await page
    .getByRole('group', { name: 'Tipo de serie' })
    .getByRole('button', { name: set.type ?? 'Efectiva' })
    .click();
  if (set.rir !== undefined)
    await page.getByRole('button', { name: `RIR ${set.rir}`, exact: true }).click();
  await page.getByRole('button', { name: /^Registrar serie/ }).click();
  await expect(page.locator('.set-row')).toHaveCount(before + 1);
}

export async function finishWorkout(page: Page) {
  await page.getByRole('button', { name: 'Finalizar' }).click();
  await page.getByRole('button', { name: 'Finalizar y guardar' }).click();
  await expect(page.getByText('Entrenamiento guardado')).toBeVisible();
}
