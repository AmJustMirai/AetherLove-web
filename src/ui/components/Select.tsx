// Themed single-choice dropdown (region, race, gender, job, expansion). Native <select> for built-in
// keyboard/a11y behaviour, restyled to match the dark fields. Replaces the plugin's ImGui.Combo calls.

import type { Option } from '../../shared/enumLabels';
import { cn } from '../cn';

interface SelectProps<T extends number> {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function Select<T extends number>({
  label,
  value,
  options,
  onChange,
  className,
}: SelectProps<T>) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-1 block text-[13px] font-medium text-subtle">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as T)}
        className="w-full appearance-none rounded-xl border border-line/10 bg-void/30 px-3 py-2 text-[15px] text-body outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#160d1f]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
