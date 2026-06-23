// Themed button, port of the plugin's PushThemeButton styling (ButtonNormal/Hovered/Active from the
// active ThemeDefinition). The primary variant is the accent-gradient call to action; ghost is the
// quiet back/secondary action.

import type {ButtonHTMLAttributes, ReactNode} from 'react';
import {cn} from '../cn';
import {LoadingSpinner} from './LoadingSpinner';

type Variant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    loading?: boolean;
    children: ReactNode;
}

const VARIANT: Record<Variant, string> = {
    primary:
        'text-on-accent bg-[rgb(var(--al-btn-normal))] hover:bg-[rgb(var(--al-btn-hovered))] active:bg-[rgb(var(--al-btn-active))] shadow-[0_4px_16px_-6px_rgb(var(--al-accent)/0.7)]',
    ghost:
        'text-body bg-surface/5 hover:bg-surface/10 active:bg-surface/[0.07] border border-line/10',
    danger: 'text-on-accent bg-danger/80 hover:bg-danger active:bg-danger/70',
};

export function Button({
                           variant = 'primary',
                           loading = false,
                           disabled,
                           className,
                           children,
                           ...rest
                       }: ButtonProps) {
    return (
        <button
            {...rest}
            disabled={disabled || loading}
            className={cn(
                'relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5',
                'font-body text-[15px] font-semibold leading-none transition-colors duration-150',
                'disabled:cursor-not-allowed disabled:opacity-50',
                VARIANT[variant],
                className
            )}
        >
            {loading && <LoadingSpinner size={14} className="text-current"/>}
            {children}
        </button>
    );
}
