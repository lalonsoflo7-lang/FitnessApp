import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetForm } from './SetForm';
import { EMPTY_DRAFT } from '../../domain/workoutOps';

function setup(initial = EMPTY_DRAFT) {
  const onSubmit = vi.fn();
  const onDraftChange = vi.fn();
  render(
    <SetForm
      initial={initial}
      submitLabel="Registrar serie 1"
      onSubmit={onSubmit}
      onDraftChange={onDraftChange}
    />,
  );
  return { onSubmit, onDraftChange, user: userEvent.setup() };
}

describe('SetForm', () => {
  it('uses numeric mobile keyboards and ≥16px-friendly inputs', () => {
    setup();
    expect(screen.getByLabelText('Peso (kg)')).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByLabelText('Reps')).toHaveAttribute('inputmode', 'numeric');
  });

  it('submits parsed values with a comma decimal and optional RIR', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText('Peso (kg)'), '82,5');
    await user.type(screen.getByLabelText('Reps'), '6');
    await user.click(screen.getByRole('button', { name: 'Drop' }));
    await user.click(screen.getByRole('button', { name: 'RIR 1' }));
    await user.click(screen.getByRole('button', { name: 'Registrar serie 1' }));
    expect(onSubmit).toHaveBeenCalledWith({ weight: 82.5, reps: 6, setType: 'dropset', rir: 1 });
  });

  it('keeps RIR null by default', async () => {
    const { onSubmit, user } = setup({ weight: '80', reps: '8', setType: 'working', rir: null });
    await user.click(screen.getByRole('button', { name: 'Registrar serie 1' }));
    expect(onSubmit).toHaveBeenCalledWith({ weight: 80, reps: 8, setType: 'working', rir: null });
  });

  it('rejects negative weight, decimal reps and empty values without submitting', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText('Peso (kg)'), '-5');
    await user.type(screen.getByLabelText('Reps'), '7.5');
    await user.click(screen.getByRole('button', { name: 'Registrar serie 1' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('steppers adjust weight by 2.5 kg and never go below 0', async () => {
    const { onDraftChange, user } = setup({
      weight: '2.5',
      reps: '1',
      setType: 'working',
      rir: null,
    });
    await user.click(screen.getByRole('button', { name: 'Sumar 2.5 kg' }));
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('5');
    await user.click(screen.getByRole('button', { name: 'Restar 2.5 kg' }));
    await user.click(screen.getByRole('button', { name: 'Restar 2.5 kg' }));
    await user.click(screen.getByRole('button', { name: 'Restar 2.5 kg' }));
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('0');
    await user.click(screen.getByRole('button', { name: 'Restar una repetición' }));
    await user.click(screen.getByRole('button', { name: 'Restar una repetición' }));
    expect(screen.getByLabelText('Reps')).toHaveValue('0');
    expect(onDraftChange).toHaveBeenCalled();
  });
});
