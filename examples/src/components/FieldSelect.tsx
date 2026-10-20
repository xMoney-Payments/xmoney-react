export function FieldSelect({
  label,
  value,
  options,
  onChange,
  borderColor,
  background,
  color,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  borderColor: string;
  background: string;
  color: string;
}) {
  return (
    <label className="grid gap-1.5 text-[13px] font-medium">
      <span className="opacity-55">{label}</span>
      <span className="relative block">
        <select
          className="field-select w-full cursor-pointer appearance-none !rounded-2xl !border !py-[13px] !pr-10 !pl-4 !text-[16px] !font-medium shadow-sm"
          style={{ borderColor, background, color }}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Chevron />
      </span>
    </label>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 opacity-30"
      fill="none"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
