import Link from 'next/link';
import HistoryTable from '../../components/HistoryTable';

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Späť na nový formulár
          </Link>
          <span className="text-xs text-gray-400 font-mono">SayClinic v1.0.0</span>
        </div>

        <HistoryTable />
      </div>
    </main>
  );
}
