import Link from 'next/link';
import { FileSearch, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div
        className="w-16 h-16 rounded-[var(--radius-xl)] flex items-center justify-center mb-5"
        style={{ background: 'var(--bg-subtle)' }}
      >
        <FileSearch size={28} style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Page not found
      </h1>
      <p
        className="text-sm mb-8 max-w-xs"
        style={{ color: 'var(--text-secondary)' }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 h-9 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-colors"
        style={{
          background: 'var(--brand)',
          color: '#fff',
        }}
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>
    </div>
  );
}
