import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <span className="mb-6 flex size-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
        <Compass className="size-10 text-slate-400" aria-hidden />
      </span>
      <p className="mb-2 text-6xl font-black tracking-tight text-slate-200">404</p>
      <h1 className="mb-2 text-xl font-bold text-slate-800">Page not found</h1>
      <p className="mb-8 text-sm text-slate-500">This address does not exist in the directory.</p>
      <Link to="/" className="btn-primary px-5 py-2.5">
        <Home className="size-4" aria-hidden />
        Back to User Directory
      </Link>
    </main>
  );
}
