import { BottomNav } from '@/components/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      {/* Mobile: Add padding bottom for bottom nav */}
      {/* Desktop: Add padding left for side nav */}
      <main className="pb-16 md:pb-0 md:pl-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
