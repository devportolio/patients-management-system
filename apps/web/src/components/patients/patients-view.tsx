'use client';

import type { Patient } from '@pms/shared';
import { ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/use-debounce';
import { useSession } from '@/features/auth/use-auth';
import { usePatients } from '@/features/patients/use-patients';
import { DeletePatientDialog } from './delete-patient-dialog';
import { PatientDetailsDialog } from './patient-details-dialog';
import { PatientFormDialog } from './patient-form-dialog';
import { EmptyState, ErrorState, MobileSkeleton, TableSkeleton } from './patients-states';
import { PatientsTable, type SortableField } from './patients-table';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DialogMode = 'create' | 'edit' | 'view' | 'delete' | null;

const PAGE_SIZE = 10;

export function PatientsView() {
  const { data: user } = useSession();
  const canManage = user?.role === 'admin';

  const [searchInput, setSearchInput] = React.useState('');
  const search = useDebounce(searchInput);
  const [sortBy, setSortBy] = React.useState<SortableField>('lastName');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);

  const [mode, setMode] = React.useState<DialogMode>(null);
  const [selected, setSelected] = React.useState<Patient | null>(null);

  // Any change to the result set should bring us back to the first page.
  React.useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder]);

  const query = usePatients({ page, limit: PAGE_SIZE, search, sortBy, sortOrder });
  const result = query.data;
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const handleSort = (field: SortableField) => {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openDialog = (next: DialogMode, patient: Patient | null = null) => {
    setSelected(patient);
    setMode(next);
  };
  const closeDialog = () => setMode(null);

  const isInitialLoading = query.isLoading;
  const isEmpty = !isInitialLoading && !query.isError && (result?.data.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Patients</h1>
          {total > 0 && <Badge variant="secondary">{total}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {canManage
            ? 'View, add, edit and remove patient records.'
            : 'Browse patient records (view-only access).'}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9 pr-9"
            aria-label="Search patients"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {canManage && (
          <Button onClick={() => openDialog('create')} className="sm:w-auto">
            <Plus />
            Add patient
          </Button>
        )}
      </div>

      {/* Results */}
      <Card className="overflow-hidden">
        {query.isError ? (
          <ErrorState
            message={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : isInitialLoading ? (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Date of birth</TableHead>
                    <TableHead className="hidden lg:table-cell">Added</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeleton />
                </TableBody>
              </Table>
            </div>
            <div className="p-4">
              <MobileSkeleton />
            </div>
          </>
        ) : isEmpty ? (
          <EmptyState hasSearch={Boolean(search)} onClear={() => setSearchInput('')} />
        ) : (
          <div className="p-2 md:p-0">
            <div className={query.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <PatientsTable
                patients={result?.data ?? []}
                canManage={canManage}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onView={(p) => openDialog('view', p)}
                onEdit={(p) => openDialog('edit', p)}
                onDelete={(p) => openDialog('delete', p)}
              />
            </div>
          </div>
        )}

        {/* Pagination footer */}
        {!query.isError && !isEmpty && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isInitialLoading ? (
                'Loading…'
              ) : (
                <>
                  Showing <span className="font-medium text-foreground">{rangeStart}</span>–
                  <span className="font-medium text-foreground">{rangeEnd}</span> of{' '}
                  <span className="font-medium text-foreground">{total}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              {query.isFetching && !isInitialLoading && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
              )}
              <span className="hidden text-sm text-muted-foreground sm:inline">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isInitialLoading}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isInitialLoading}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <PatientFormDialog
        open={mode === 'create' || mode === 'edit'}
        onOpenChange={(open) => !open && closeDialog()}
        patient={mode === 'edit' ? selected : null}
      />
      <PatientDetailsDialog
        open={mode === 'view'}
        onOpenChange={(open) => !open && closeDialog()}
        patient={selected}
      />
      <DeletePatientDialog
        open={mode === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        patient={selected}
      />
    </div>
  );
}
