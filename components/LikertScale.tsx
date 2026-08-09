'use client';

export type LikertValue = -2 | -1 | 0 | 1 | 2;

type LikertScaleProps = {
  disabled?: boolean;
  onChange: (value: LikertValue) => void;
  value?: LikertValue;
};

const options: Array<{
  label: string;
  shortLabel: string;
  size: string;
  value: LikertValue;
}> = [
  { value: 2, label: '매우 그렇다', shortLabel: '매우\n그렇다', size: 'size-16' },
  { value: 1, label: '그렇다', shortLabel: '그렇다', size: 'size-[3.25rem]' },
  { value: 0, label: '보통', shortLabel: '보통', size: 'size-10' },
  { value: -1, label: '그렇지 않다', shortLabel: '그렇지\n않다', size: 'size-[3.25rem]' },
  { value: -2, label: '매우 그렇지 않다', shortLabel: '매우 그렇지\n않다', size: 'size-16' },
];

export function LikertScale({ disabled = false, onChange, value }: LikertScaleProps) {
  return (
    <fieldset className="w-full" disabled={disabled}>
      <legend className="sr-only">이 문장에 동의하는 정도를 선택해 주세요.</legend>
      <div className="flex items-center justify-between gap-1" role="radiogroup">
        {options.map((option) => {
          const selected = value === option.value;
          const positive = option.value > 0;
          const negative = option.value < 0;

          return (
            <label className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-3" key={option.value}>
              <input
                checked={selected}
                className="peer sr-only"
                name="likert-answer"
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span
                aria-hidden
                className={`${option.size} rounded-full border-3 border-black shadow-neo transition-transform peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-black peer-checked:translate-x-1 peer-checked:translate-y-1 peer-checked:shadow-none ${
                  selected
                    ? 'bg-brand-yellow'
                    : positive
                      ? 'bg-brand-mint'
                      : negative
                        ? 'bg-brand-pink'
                        : 'bg-white'
                }`}
              />
              <span className="min-h-9 whitespace-pre-line text-center text-[10px] font-black leading-4 sm:text-xs">
                {option.shortLabel}
              </span>
            </label>
          );
        })}
      </div>
      <div aria-hidden className="mt-3 flex justify-between px-1 text-[10px] font-black text-neutral-500">
        <span>동의</span>
        <span>비동의</span>
      </div>
    </fieldset>
  );
}
