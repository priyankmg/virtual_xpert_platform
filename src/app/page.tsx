import HomeDashboard from './home-dashboard';

/** Avoid stale CDN/HTML cache serving an outdated dashboard shell after deploys. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <HomeDashboard />;
}
