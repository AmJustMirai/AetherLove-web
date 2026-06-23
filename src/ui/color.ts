// Validation for server-supplied CSS color literals (e.g. FlairDto.BackgroundColor) before they go
// into a React inline style. React's object-form style={{}} already prevents property breakout, so
// this is defense-in-depth: it keeps untrusted strings from smuggling url(...)/expression(...)/extra
// declarations into a style attribute and rejects anything that isn't a plain color literal.

// #rgb, #rgba, #rrggbb, #rrggbbaa
const HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
// rgb()/rgba()/hsl()/hsla() with only digits, separators and units inside the parens — no url(,
// no expression, no ; { } that could terminate or extend the declaration.
const FUNC = /^(?:rgb|rgba|hsl|hsla)\([0-9.,%/\s]+\)$/;

/** Returns `value` only if it is a safe CSS color literal (hex or rgb/hsl function), else `fallback`. */
export function safeColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const v = value.trim();
  return HEX.test(v) || FUNC.test(v) ? v : fallback;
}
