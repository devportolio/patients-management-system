'use client';

import type { Patient } from '@pms/shared';
import { ArrowDown, ArrowUp, ChevronsUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calculateAge, cn, formatDate, initials } from '@/lib/utils';

export type SortableField = 'lastName' | 'email' | 'dob' | 'createdAt';

interface PatientsTableProps {
  patients: Patient[];
  canManage: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortableField) => void;
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

function SortHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  field: SortableField;
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: SortableField) => void;
  className?: string;
}) {
  const active = sortBy === field;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          active && 'text-foreground',
        )}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active ? (
          sortOrder === 'asc' ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

function RowActions({
  patient,
  canManage,
  onView,
  onEdit,
  onDelete,
}: {
  patient: Patient;
  canManage: boolean;
  onView: (p: Patient) => void;
  onEdit: (p: Patient) => void;
  onDelete: (p: Patient) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${patient.firstName} ${patient.lastName}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onView(patient)}>
          <Eye />
          View details
        </DropdownMenuItem>
        {canManage && (
          <>
            <DropdownMenuItem onSelect={() => onEdit(patient)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => onDelete(patient)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Avatar({ patient }: { patient: Patient }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
      {initials(patient.firstName, patient.lastName)}
    </span>
  );
}

export function PatientsTable(props: PatientsTableProps) {
  const { patients, canManage, sortBy, sortOrder, onSort, onView, onEdit, onDelete } = props;

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortHeader field="lastName" label="Name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              <SortHeader
                field="email"
                label="Email"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className="hidden md:table-cell"
              />
              <SortHeader
                field="dob"
                label="Date of birth"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className="hidden lg:table-cell"
              />
              <SortHeader
                field="createdAt"
                label="Added"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={onSort}
                className="hidden lg:table-cell"
              />
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow
                key={patient.id}
                className="cursor-pointer"
                onClick={() => onView(patient)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar patient={patient} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground md:hidden">{patient.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {patient.email}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatDate(patient.dob)}{' '}
                  <span className="text-muted-foreground">({calculateAge(patient.dob)})</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {formatDate(patient.createdAt)}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActions
                    patient={patient}
                    canManage={canManage}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="space-y-3 md:hidden" aria-label="Patients">
        {patients.map((patient) => (
          <li key={patient.id}>
            <div
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
              onClick={() => onView(patient)}
            >
              <Avatar patient={patient} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="truncate text-sm text-muted-foreground">{patient.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  DOB {formatDate(patient.dob)} · {calculateAge(patient.dob)} yrs
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <RowActions
                  patient={patient}
                  canManage={canManage}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
