// Selectable chip — the plugin's flag-mask pickers (looking-for, content interests, languages…) are
// grids of these. Selected chips use the accent fill; unselected use the dark chip-fill with an accent
// border, matching ThemeDefinition.ChipFill / ChipBorder.

import {cn} from '../cn';

interface ChipProps {
    label: string;
    selected: boolean;
    onToggle: () => void;
    /** Optional secondary-gradient styling for content-preference chips (ThemeDefinition.Secondary*). */
    gradient?: boolean;
    disabled?: boolean;
}

export function Chip({label, selected, onToggle, gradient = false, disabled = false}: ChipProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={onToggle}
            className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-medium leading-none transition-all duration-150',
                'border disabled:opacity-40',
                selected
                    ? gradient
                        ? 'border-transparent bg-gradient-to-r from-secondary-start to-secondary-end text-on-accent'
                        : 'border-accent bg-accent text-on-accent'
                    : 'border-accent/40 bg-chip-fill text-subtle hover:border-accent/70 hover:text-body',
            )}
        >
            {label}
        </button>
    );
}
