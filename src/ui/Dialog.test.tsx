import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Dialog } from './Dialog';

function Opener() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Jalons
      </button>
      {open && (
        <Dialog title="Jalons" closeLabel="Fermer" onClose={() => setOpen(false)}>
          <p>…</p>
        </Dialog>
      )}
    </>
  );
}

describe('Dialog', () => {
  it('moves focus inside, then gives it back to the opener on Escape', () => {
    render(<Opener />);
    const opener = screen.getByRole('button', { name: 'Jalons' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
