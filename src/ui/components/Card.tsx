// Generic rounded panel used by screen sections (settings rows, profile blocks). The deck's swipe card
// is its own component (screens/deck) since it carries gesture state.

import type {ReactNode} from 'react';
import {cn} from '../cn';

export function Card({children, className}: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('rounded-2xl border border-line/10 bg-surface/[0.04] p-4', className)}>
            {children}
        </div>
    );
}
