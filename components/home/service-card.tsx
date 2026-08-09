import Link from 'next/link';

type ServiceCardProps = {
  badge: string;
  description: string;
  emoji: string;
  href?: string;
  label: string;
  theme: 'blue' | 'mint' | 'pink';
  title: string;
};

const themeClasses = {
  blue: 'bg-brand-blue',
  mint: 'bg-brand-mint',
  pink: 'bg-brand-pink',
} as const;

export function ServiceCard({
  badge,
  description,
  emoji,
  href,
  label,
  theme,
  title,
}: ServiceCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-extrabold">
          {badge}
        </span>
        <span aria-hidden className="text-4xl drop-shadow-[2px_2px_0_#000]">
          {emoji}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6">{description}</p>
      <span className="mt-5 flex min-h-12 items-center justify-center rounded-2xl border-3 border-black bg-white px-4 text-center font-black shadow-neo transition-transform group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:translate-y-1 group-active:shadow-none">
        {label}
      </span>
    </>
  );

  const className = `group block rounded-3xl border-3 border-black p-5 shadow-neo-lg ${themeClasses[theme]}`;

  if (!href) {
    return (
      <article aria-disabled="true" className={`${className} cursor-not-allowed opacity-60`}>
        {content}
      </article>
    );
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}
