import { expect, test } from '@playwright/test';
import { finishWorkout, logSet, nav, signUp, startRoutine } from './helpers';

test('full journey: log, history integrity, previous session, PRs and progress', async ({
  page,
}) => {
  // 1. Sign in (email/password against the Auth emulator)
  await signUp(page);

  // 2. Create exercises from the Exercises tab
  await nav(page, 'Rutinas');
  await page.getByRole('link', { name: 'Ejercicios' }).click();
  for (const name of ['Press banca', 'Press militar', 'Aperturas']) {
    await page.getByLabel('Nuevo ejercicio').fill(name);
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('list', { name: 'Ejercicios', exact: true })).toContainText(name);
  }

  // 3–4. Create a routine and add exercises (existing + one created inline)
  await nav(page, 'Rutinas');
  await page.getByRole('link', { name: 'Nueva' }).click();
  await page.getByLabel('Nombre').fill('Push');
  for (const name of ['Press banca', 'Press militar', 'Aperturas']) {
    await page.getByRole('button', { name: `Agregar ${name}` }).click();
  }
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await expect(page.getByRole('heading', { name: 'Push', exact: true })).toBeVisible();

  // 5. Start the workout
  await startRoutine(page, 'Push');
  await expect(page.getByRole('heading', { name: 'Press banca' })).toBeVisible();
  await expect(page.getByText('No hay historial todavía para este ejercicio.')).toBeVisible();

  // 6–8. Several sets, different types, optional RIR
  await logSet(page, { weight: '40', reps: '10', type: 'Cal.' });
  await logSet(page, { weight: '80', reps: '8', type: 'Efectiva', rir: 2 });
  // Prefill: the next set repeats the last one (weight + type), user only edits reps.
  await expect(page.getByLabel('Peso (kg)')).toHaveValue('80');
  await page.getByLabel('Reps').fill('7');
  await page.getByRole('button', { name: 'Registrar serie 3' }).click();
  await expect(page.locator('.set-row')).toHaveCount(3);
  await logSet(page, { weight: '60', reps: '10', type: 'Drop' });

  await page.getByRole('button', { name: /Siguiente: Press militar/ }).click();
  await logSet(page, { weight: '50', reps: '8' });

  // 9. Finish (Aperturas is left without sets)
  await finishWorkout(page);

  // 10–11. History shows exactly what was logged
  await nav(page, 'Historial');
  await page
    .getByRole('link', { name: /^Push,/ })
    .first()
    .click();
  const bench = page.getByRole('listitem', { name: 'Press banca' });
  await expect(bench.getByRole('row')).toHaveCount(5); // header + 4 sets
  await expect(bench.getByRole('row').nth(1)).toContainText('40 kg × 10');
  await expect(bench.getByRole('row').nth(1)).toContainText('Calentamiento');
  await expect(bench.getByRole('row').nth(2)).toContainText('80 kg × 8');
  await expect(bench.getByRole('row').nth(2)).toContainText('2');
  await expect(bench.getByRole('row').nth(4)).toContainText('Drop set');
  // Volume excludes warm-up: 640 + 560 + 600 = 1,800
  await expect(bench).toContainText('1,800 kg');
  await expect(page.getByRole('listitem', { name: 'Aperturas' })).toContainText('No realizado');
  const workoutUrl = page.url();

  // 12. Modify the routine: remove Aperturas, add Fondos; rename an exercise
  await nav(page, 'Rutinas');
  await page.getByRole('link', { name: 'Editar Push' }).click();
  await page.getByRole('button', { name: 'Quitar Aperturas de la rutina' }).click();
  const search = page.getByPlaceholder('Buscar o crear ejercicio');
  await search.fill('Fondos');
  await search.press('Enter');
  await page.getByLabel('Nombre').fill('Push A');
  await page.getByRole('button', { name: 'Guardar rutina' }).click();
  await page.getByRole('link', { name: 'Ejercicios' }).click();
  await page.getByRole('button', { name: 'Renombrar Press militar' }).click();
  await page.getByLabel('Nuevo nombre para Press militar').fill('Press militar de pie');
  await page.getByRole('button', { name: 'Guardar nombre' }).click();
  await expect(page.getByRole('link', { name: 'Press militar de pie' })).toBeVisible();

  // 13. The past workout did NOT change
  await page.goto(workoutUrl.replace('?terminado=1', ''));
  await expect(page.getByRole('heading', { name: 'Push', exact: true })).toBeVisible();
  const names = page.getByRole('list', { name: 'Ejercicios del entrenamiento' }).locator('h2');
  await expect(names).toHaveText(['Press banca', 'Press militar', 'Aperturas']);
  await expect(page.getByText('Fondos')).toHaveCount(0);

  // 14. Start another session with the edited routine
  await startRoutine(page, 'Push A');
  await expect(
    page.getByRole('navigation', { name: 'Ejercicios del entrenamiento' }),
  ).toContainText('Press militar de pie');

  // 15. The previous session is shown as reference
  const reference = page.getByRole('region', { name: 'Última sesión' });
  await expect(reference).toContainText('80 kg × 8');
  await expect(reference).toContainText('80 kg × 7');
  await expect(reference).toContainText('60 kg × 10');
  // First set suggestion comes from the previous session (not saved until confirmed)
  await expect(page.getByLabel('Peso (kg)')).toHaveValue('40');
  await expect(page.locator('.set-row')).toHaveCount(0);

  // 16. Beat a mark
  await logSet(page, { weight: '40', reps: '10', type: 'Cal.' });
  await logSet(page, { weight: '82.5', reps: '8', type: 'Efectiva', rir: 1 });

  // 17. PR and deltas are shown
  const prSet = page.getByRole('button', { name: /Serie 2: 82.5 kg × 8/ });
  await expect(prSet).toContainText('PR peso');
  await expect(prSet).toContainText('+2.5 kg');
  await expect(page.getByRole('list', { name: 'Récords de hoy' })).toContainText(
    'Nuevo peso máximo: 82.5 kg',
  );
  await logSet(page, { weight: '80', reps: '9' });
  await expect(page.getByRole('button', { name: /Serie 3: 80 kg × 9/ })).toContainText('+2 reps');
  await expect(page.getByRole('list', { name: 'Récords de hoy' })).toContainText(
    'Nueva marca de repeticiones con 80 kg: 9',
  );
  await finishWorkout(page);
  await expect(page.getByRole('listitem', { name: 'Press banca' })).toContainText(
    'Nuevo peso máximo: 82.5 kg',
  );

  // 18. Progress and metrics
  await nav(page, 'Inicio');
  await expect(page.getByRole('region', { name: 'Progreso reciente' })).toContainText(
    'Press banca',
  );
  await nav(page, 'Progreso');
  await page.getByRole('link', { name: /Press banca/ }).click();
  const summary = page.getByRole('region', { name: 'Resumen del ejercicio' });
  await expect(summary).toContainText('82.5 kg');
  await expect(summary).toContainText('Sesiones2');
  // e1RM: 82.5 × (1 + 8/30) = 104.5
  await expect(summary).toContainText('104.5 kg');
  await expect(page.locator('.recharts-surface')).toBeVisible();
  await page.getByRole('button', { name: 'Volumen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evolución · Volumen' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Récords personales' })).toContainText(
    'Nuevo peso máximo: 82.5 kg',
  );
  await page.screenshot({ path: 'test-results/progress.png', fullPage: true });
});
