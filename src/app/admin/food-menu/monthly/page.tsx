import { redirect } from 'next/navigation';

// The monthly list is now the main Food Menu view; keep old links working.
export default async function MonthlyMenusRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (typeof v === 'string') q.set(k, v);
  });
  redirect(`/admin/food-menu${q.size ? `?${q}` : ''}`);
}
