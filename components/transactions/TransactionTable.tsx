
import React from 'react';
import { flexRender, Table } from '@tanstack/react-table';
import { Transaction } from '../../types';
import { Tag, ChevronsUpDown } from 'lucide-react';

export const IndeterminateCheckbox: React.FC<{ indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>> =
    ({ indeterminate, className = '', ...rest }) => {
    const ref = React.useRef<HTMLInputElement>(null!);

    React.useEffect(() => {
        if (typeof indeterminate === 'boolean') {
            ref.current.indeterminate = !rest.checked && indeterminate;
        }
    }, [ref, indeterminate, rest.checked]);

    return (
        <input
            type="checkbox"
            ref={ref}
            className={className + " cursor-pointer w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"}
            {...rest}
        />
    );
};

export const TransactionTable: React.FC<{ table: Table<Transaction> }> = ({ table }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full" style={{width: table.getCenterTotalSize()}}>
                <thead className="bg-slate-50">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider select-none relative group"
                                    style={{ width: header.getSize() }}
                                >
                                    {header.isPlaceholder ? null : (
                                    <div
                                        className={header.column.getCanSort() ? 'cursor-pointer' : ''}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-2">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: '▲',
                                                desc: '▼',
                                            }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? <ChevronsUpDown size={14} className="text-slate-400" /> : null)}
                                        </div>
                                    </div>
                                    )}
                                    {header.column.getCanResize() && (
                                        <div
                                            onMouseDown={header.getResizeHandler()}
                                            onTouchStart={header.getResizeHandler()}
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-primary/20 opacity-0 group-hover:opacity-100"
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="p-4 text-sm text-slate-600 align-top" style={{ width: cell.column.getSize() }}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {table.getRowModel().rows.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <Tag size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold">No Transactions Found</h3>
                    <p>Try adjusting your filters or selecting a different month.</p>
                </div>
            )}
        </div>
    );
};
