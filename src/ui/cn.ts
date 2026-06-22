/** Tiny classnames joiner — filters falsy entries. Avoids a dependency for the common conditional case. */
export function cn(...parts: Array<string | false | null | undefined>): string {
    return parts.filter(Boolean).join(' ');
}
