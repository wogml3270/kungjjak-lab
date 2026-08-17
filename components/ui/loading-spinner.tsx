type LoadingSpinnerProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizes = { sm: 'size-5 border-2', md: 'size-9 border-[3px]', lg: 'size-14 border-4' };

export function LoadingSpinner({ label = '불러오는 중', size = 'md' }: LoadingSpinnerProps) {
  return (
    <div aria-live="polite" className="flex items-center justify-center gap-3" role="status">
      <span
        aria-hidden
        className={`${sizes[size]} animate-spin rounded-full border-black border-r-brand-pink border-t-brand-blue`}
      />
      {label ? <span className="text-sm font-black">{label}</span> : null}
    </div>
  );
}
