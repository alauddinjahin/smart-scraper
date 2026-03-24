import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-page)]">
      <Sidebar />
      <main className="flex-1 overflow-auto min-w-0 bg-[var(--bg-page)] mt-7 md:mt-0 px-2 main-layout">
        {children}
      </main>
    </div>
  );
}
