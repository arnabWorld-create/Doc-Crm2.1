// A simple but robust CSV stringifier
export function stringifyToCsv<T extends object>(data: T[], headers: (keyof T)[]): string {
  const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const str = String(field);
    // If the field contains a comma, double quote, or newline, wrap it in double quotes
    // and escape any existing double quotes by doubling them.
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(header => escapeCsvField(header)).join(',');
  const dataRows = data.map(row =>
    headers.map(header => escapeCsvField(row[header])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}
