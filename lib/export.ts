/**
 * CSV export helpers.
 *
 * Why this matters: admins need to pull data into Excel/Sheets without us
 * building a full reporting suite. CSV is the universal export format.
 */

export function toCSV<T extends Record<string, any>>(
  rows: T[],
  columns: { key: keyof T | string; label: string; map?: (row: T) => string }[]
): string {
  const headers = columns.map((c) => escapeCSV(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const value = c.map ? c.map(row) : row[c.key as keyof T];
          return escapeCSV(value);
        })
        .join(",")
    )
    .join("\n");
  return headers + "\n" + body;
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
