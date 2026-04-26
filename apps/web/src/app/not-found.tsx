import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4">
      <p className="text-sm font-medium text-surface-500">404</p>
      <h1 className="mt-1 text-2xl font-semibold text-surface-800">This page could not be found</h1>
      <p className="mt-2 max-w-md text-center text-sm text-surface-500">
        Check the address — pages like <code className="rounded bg-surface-200/80 px-1">/layout.css</code> are not
        routes. Use the links below to continue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Log in
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50"
        >
          Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
