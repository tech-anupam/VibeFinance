import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="text-3xl font-bold text-text-primary">404 - Case Not Found</h2>
      <p className="mt-2 text-sm text-text-muted">The court document or page you requested could not be located.</p>
      <Link
        href="/"
        className="mt-6 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent-hover"
      >
        Return to Courtroom
      </Link>
    </div>
  );
}
