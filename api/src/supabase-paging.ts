// PostgREST caps every response at max_rows (1000, see supabase/config.toml),
// so queries that aggregate over a growing table must page through it.
// The callback must apply a stable .order() before .range(from, to).
const PAGE_SIZE = 1000;

type PageError = { message: string } | null;

export async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PageError }>,
): Promise<{ data: T[] | null; error: PageError }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null };
  }
}
