export type QueryError = { code?: string; message?: string } | null;

/** The notes tables don't exist yet (migration 019 not run). */
export function isMissingTable(error: QueryError): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache/i.test(error.message ?? "")
  );
}
