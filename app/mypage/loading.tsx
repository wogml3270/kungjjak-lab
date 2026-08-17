import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function MyPageLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <div className="w-full rounded-3xl border-3 border-black bg-brand-yellow p-8 shadow-neo-lg">
        <LoadingSpinner label="마이페이지를 준비하고 있어요" size="lg" />
      </div>
    </main>
  );
}
