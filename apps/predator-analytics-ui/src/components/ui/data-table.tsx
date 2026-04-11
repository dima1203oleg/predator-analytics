import React from 'react';

export type Column<T = any> = {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  exportable?: boolean;
}

export const DataTable = <T,>({ data, columns, onRowClick }: DataTableProps<T>) => {
  return (
    <div className="w-full">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs text-slate-400 uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }} className="px-4 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {data.map((row, idx) => (
            <tr key={(row as any).id || idx} className="hover:bg-slate-800 cursor-pointer" onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-top">
                  {col.render ? col.render(row) : (row as any)[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

