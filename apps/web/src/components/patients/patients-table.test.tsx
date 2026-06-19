import type { Patient } from '@pms/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PatientsTable } from './patients-table';

const patient: Patient = {
  id: '11111111-1111-1111-1111-111111111111',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phoneNumber: '+1 (555) 123-4567',
  dob: '1990-12-10',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const noop = vi.fn();

function renderTable(canManage: boolean) {
  return render(
    <PatientsTable
      patients={[patient]}
      canManage={canManage}
      sortBy="lastName"
      sortOrder="asc"
      onSort={noop}
      onView={noop}
      onEdit={noop}
      onDelete={noop}
    />,
  );
}

describe('PatientsTable', () => {
  it('renders the patient name and email', () => {
    renderTable(true);
    // Name appears in both the desktop table and the mobile card.
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ada@example.com').length).toBeGreaterThan(0);
  });

  it('exposes an actions menu for every patient', () => {
    renderTable(true);
    const actionButtons = screen.getAllByRole('button', {
      name: /actions for ada lovelace/i,
    });
    expect(actionButtons.length).toBeGreaterThan(0);
  });

  it('shows a sortable Name header reflecting the active sort', () => {
    renderTable(false);
    const sortButton = screen.getByRole('button', { name: /sort by name/i });
    expect(within(sortButton).queryByText('Name')).toBeInTheDocument();
  });
});
