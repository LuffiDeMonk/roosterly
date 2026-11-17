import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/shared/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MoveUp, MoveDown } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export type RowSelectionState<TData> = TData[];

export type OnChangeFn<T> = (updaterOrValue: T | ((old: T) => T)) => void;

export interface TableRowContext<TData> {
  original: TData;
  id: string;
  isSelected: boolean;
  toggleSelected: (value?: boolean) => void;
}

export interface TableHeaderContext {
  isAllPageRowsSelected: boolean;
  toggleAllPageRowsSelected: (value?: boolean) => void;
}

export type SortOrder = "ASC" | "DESC" | null;

export interface SortState {
  key: string;
  order: SortOrder;
}

export interface ColumnDef<TData> {
  id?: string;
  accessorKey?: string;
  header?: ReactNode | ((ctx: TableHeaderContext) => ReactNode);
  cell?: (ctx: { row: TableRowContext<TData> }) => ReactNode;
  skeletonCell?: (ctx: { rowIndex: number }) => ReactNode;
  sortable?: boolean;
  /** Fixed pixel or percentage width, e.g. 120 or '10%' */
  width?: number | string;
  /** Minimum column width in pixels */
  minWidth?: number;
  /** Maximum column width in pixels */
  maxWidth?: number;
}

function getNestedValue<T>(obj: T, path: string) {
  if (!path) return undefined;
  return path.split(".").reduce((acc: any, key: string) => acc?.[key], obj);
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  totalRows: number;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  enableSelection?: boolean;
  rowSelection?: RowSelectionState<TData>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState<TData>>;
  onRowClick?: (row: TData) => void;
  sortState?: SortState;
  onSortChange?: (state: SortState) => void;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  /** Number of skeleton rows to render in loading state (default: 5) */
  skeletonCount?: number;
  skeletonRowCount?: number;
  emptyMessage?: string;
  containerClassNames?: string;
  tableWrapperClassNames?: string;
  tableWrapperStyle?: CSSProperties;
  tableClassName?: string;
  hidePagination?: boolean;
  paginationLabel?: string;
  /** Whether to apply alternating zebra striping to data rows (default: false for Apple style) */
  striped?: boolean;
}

export function DataTable<TData>({
  columns: userColumns,
  data,
  totalRows,
  pagination,
  onPaginationChange,
  enableSelection = true,
  rowSelection = [],
  onRowSelectionChange,
  onRowClick,
  sortState,
  onSortChange,
  pageSizeOptions = [10, 25, 50],
  isLoading = false,
  skeletonCount,
  skeletonRowCount,
  emptyMessage = "No results found.",
  containerClassNames,
  tableWrapperClassNames,
  tableWrapperStyle,
  tableClassName,
  hidePagination = false,
  paginationLabel = "items",
  striped = false,
}: DataTableProps<TData>) {
  const loadingRowCount = skeletonCount ?? skeletonRowCount ?? 4;
  const isAllPageRowsSelected =
    data.length > 0 && data.every((row) => rowSelection.includes(row));

  const emitSelectionChanges = (newSelection: RowSelectionState<TData>) => {
    if (onRowSelectionChange) {
      onRowSelectionChange(newSelection);
    }
  };

  const toggleAllPageRowsSelected = (value?: boolean) => {
    let newSelection = [...rowSelection];
    if (value) {
      data.forEach((row) => {
        if (!newSelection.includes(row)) {
          newSelection.push(row);
        }
      });
    } else {
      newSelection = newSelection.filter((item) => !data.includes(item));
    }
    emitSelectionChanges(newSelection);
  };

  const selectionColumn: ColumnDef<TData> = {
    id: "select",
    header: ({
      isAllPageRowsSelected: allSelected,
      toggleAllPageRowsSelected: toggleAll,
    }) => (
      <Checkbox
        checked={!isLoading && allSelected}
        disabled={isLoading}
        onCheckedChange={(checked) => !isLoading && toggleAll(!!checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.isSelected}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
  };

  const activeColumns: ColumnDef<TData>[] = enableSelection
    ? [selectionColumn, ...userColumns]
    : userColumns;

  const handlePageChange = (page: number) => {
    onPaginationChange({
      ...pagination,
      pageIndex: Math.max(0, page - 1),
    });
  };

  const handlePageSizeChange = (pageSize: number) => {
    onPaginationChange({
      pageIndex: 0,
      pageSize,
    });
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTableScroll = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const hasScroll = el.scrollWidth > el.clientWidth + 1;
    setCanScrollLeft(hasScroll && el.scrollLeft > 4);
    setCanScrollRight(
      hasScroll && el.scrollLeft < el.scrollWidth - el.clientWidth - 4
    );
  }, []);

  useEffect(() => {
    checkTableScroll();
    const el = tableContainerRef.current;
    if (!el) return;

    const handleResize = () => checkTableScroll();
    window.addEventListener("resize", handleResize);

    const resizeObserver = new ResizeObserver(() => {
      checkTableScroll();
    });
    resizeObserver.observe(el);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, [checkTableScroll, data, activeColumns, isLoading]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-4 shadow-xs w-full min-w-0 max-w-full",
        containerClassNames
      )}
    >
      <div className="relative w-full min-w-0 max-w-full flex-1">
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 z-20 w-6 bg-gradient-to-r from-card to-transparent"
            aria-hidden="true"
          />
        )}

        <Table
          containerRef={tableContainerRef}
          onContainerScroll={checkTableScroll}
          wrapperClassName={cn(
            "flex-1 overflow-x-auto overflow-y-auto",
            tableWrapperClassNames
          )}
          wrapperStyle={{
            maxHeight: "var(--table-max-height, calc(100dvh - 8.5rem))",
            ...tableWrapperStyle,
          }}
          className={cn("min-w-full", tableClassName)}
        >
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="border-b border-border hover:bg-transparent">
              {activeColumns.map((col, index) => {
                const colId = col.id ?? col.accessorKey ?? String(index);
                const sortKey = col.id ?? col.accessorKey;
                const isSorted = Boolean(
                  col.sortable && sortKey && sortState?.key === sortKey
                );
                const colStyle: CSSProperties = {
                  ...(col.width !== undefined && {
                    width:
                      typeof col.width === "number"
                        ? `${col.width}px`
                        : col.width,
                  }),
                  ...(col.minWidth !== undefined && {
                    minWidth: `${col.minWidth}px`,
                  }),
                  ...(col.maxWidth !== undefined && {
                    maxWidth: `${col.maxWidth}px`,
                  }),
                };
                return (
                  <TableHead
                    key={colId}
                    style={colStyle}
                    className="h-10 text-xs font-semibold text-muted-foreground"
                    onClick={() => {
                      if (!col.sortable || !onSortChange) return;
                      if (!sortKey) return;

                      let newOrder: SortOrder = "ASC";
                      if (sortState?.key === sortKey) {
                        if (sortState.order === "ASC") {
                          newOrder = "DESC";
                        } else if (sortState.order === "DESC") {
                          newOrder = "ASC";
                        }
                      }
                      onSortChange({ key: sortKey, order: newOrder });
                    }}
                  >
                    <div
                      className={cn("flex items-center gap-1.5", {
                        "w-fit cursor-pointer select-none rounded py-0.5":
                          col.sortable,
                      })}
                    >
                      {typeof col.header === "function"
                        ? col.header({
                            isAllPageRowsSelected,
                            toggleAllPageRowsSelected,
                          })
                        : (col.header ?? colId)}
                      {col.sortable && (
                        <span className="flex shrink-0 items-center -space-x-1 ml-1">
                          <MoveUp
                            className={cn(
                              "size-2.5 cursor-pointer transition-colors",
                              isSorted && sortState?.order === "ASC"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!onSortChange || !sortKey) return;
                              if (isSorted && sortState?.order === "ASC") {
                                onSortChange({ key: sortKey, order: null });
                              } else {
                                onSortChange({ key: sortKey, order: "ASC" });
                              }
                            }}
                          />
                          <MoveDown
                            className={cn(
                              "size-2.5 cursor-pointer transition-colors",
                              isSorted && sortState?.order === "DESC"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!onSortChange || !sortKey) return;
                              if (isSorted && sortState?.order === "DESC") {
                                onSortChange({ key: sortKey, order: null });
                              } else {
                                onSortChange({ key: sortKey, order: "DESC" });
                              }
                            }}
                          />
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody
            className={cn({
              "cursor-pointer": !isLoading && typeof onRowClick === "function",
            })}
          >
            {isLoading ? (
              Array.from({ length: Math.max(1, loadingRowCount) }).map(
                (_, rowIndex) => {
                  const skeletonRowId = `skeleton-row-${rowIndex}`;
                  return (
                    <TableRow
                      key={skeletonRowId}
                      data-slot="table-skeleton-row"
                      className="border-b border-black/5 dark:border-white/10 hover:bg-transparent"
                    >
                      {activeColumns.map((col, colIndex) => {
                        const colId =
                          col.id ?? col.accessorKey ?? String(colIndex);
                        const colStyle: CSSProperties = {
                          ...(col.width !== undefined && {
                            width:
                              typeof col.width === "number"
                                ? `${col.width}px`
                                : col.width,
                          }),
                          ...(col.minWidth !== undefined && {
                            minWidth: `${col.minWidth}px`,
                          }),
                          ...(col.maxWidth !== undefined && {
                            maxWidth: `${col.maxWidth}px`,
                          }),
                        };

                        if (col.id === "select") {
                          return (
                            <TableCell key={colId} style={colStyle}>
                              <Checkbox
                                disabled
                                className="pointer-events-none opacity-40"
                                aria-label="Loading selection"
                              />
                            </TableCell>
                          );
                        }

                        if (col.skeletonCell) {
                          return (
                            <TableCell key={colId} style={colStyle}>
                              {col.skeletonCell({ rowIndex })}
                            </TableCell>
                          );
                        }

                        const skeletonWidthClasses = [
                          "w-3/4",
                          "w-5/6",
                          "w-1/2",
                          "w-2/3",
                          "w-3/5",
                        ];
                        const widthClass =
                          skeletonWidthClasses[
                            colIndex % skeletonWidthClasses.length
                          ];

                        return (
                          <TableCell key={colId} style={colStyle}>
                            <Skeleton className={cn("h-4 rounded-md", widthClass)} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                }
              )
            ) : data.length > 0 ? (
              data.map((rowData, rowIndex) => {
                const rowId = String(rowIndex);
                const isSelected = rowSelection.includes(rowData);

                const toggleSelected = (value?: boolean) => {
                  let newSelection = [...rowSelection];
                  if (value) {
                    if (!newSelection.includes(rowData)) {
                      newSelection.push(rowData);
                    }
                  } else {
                    newSelection = newSelection.filter(
                      (item) => item !== rowData
                    );
                  }
                  emitSelectionChanges(newSelection);
                };

                const rowCtx: TableRowContext<TData> = {
                  original: rowData,
                  id: rowId,
                  isSelected,
                  toggleSelected,
                };

                return (
                  <TableRow
                    key={rowId}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "h-12 border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-primary/5",
                      striped && rowIndex % 2 === 1 && "bg-muted/30"
                    )}
                    onClick={() => onRowClick?.(rowData)}
                  >
                    {activeColumns.map((col, colIndex) => {
                      const colId = col.id ?? col.accessorKey ?? String(colIndex);
                      const colStyle: CSSProperties = {
                        ...(col.width !== undefined && {
                          width:
                            typeof col.width === "number"
                              ? `${col.width}px`
                              : col.width,
                        }),
                        ...(col.minWidth !== undefined && {
                          minWidth: `${col.minWidth}px`,
                        }),
                        ...(col.maxWidth !== undefined && {
                          maxWidth: `${col.maxWidth}px`,
                        }),
                      };

                      let cellContent: ReactNode = null;
                      if (col.cell) {
                        cellContent = col.cell({ row: rowCtx });
                      } else if (col.accessorKey) {
                        const val = getNestedValue(rowData, col.accessorKey);
                        cellContent =
                          typeof val === "string" ||
                          typeof val === "number" ||
                          typeof val === "boolean"
                            ? String(val)
                            : null;
                      }

                      return (
                        <TableCell key={colId} style={colStyle} className="text-sm text-foreground">
                          {cellContent}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={activeColumns.length}
                  className="h-36 p-0 text-center text-muted-foreground"
                >
                  <div className="flex h-36 w-full items-center justify-center px-4 py-8 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {emptyMessage}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {canScrollRight && (
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 z-20 w-6 bg-gradient-to-l from-card to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {!hidePagination && (
        <Pagination
          currentPage={pagination.pageIndex + 1}
          totalItems={totalRows}
          itemsPerPage={pagination.pageSize}
          onPageChange={handlePageChange}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={handlePageSizeChange}
          label={paginationLabel}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
