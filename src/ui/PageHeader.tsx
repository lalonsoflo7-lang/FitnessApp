import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { BackIcon } from './icons';

interface Props {
  title: ReactNode;
  /** Where the back button goes. Omit to hide it. */
  back?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, back, actions }: Props) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <div className="row grow">
        {back !== undefined && (
          <button
            type="button"
            className="btn btn--ghost btn--icon page-header__back"
            onClick={() => navigate(back)}
            aria-label="Volver"
          >
            <BackIcon />
          </button>
        )}
        <h1 className="grow">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
