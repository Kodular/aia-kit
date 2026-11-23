/** App Inventor colours are `&HAARRGGBB`. Returns a CSS colour, or `undefined` if the value is not one. */
export function cssColor(value: string): string | undefined {
  const match = /^&H([0-9a-f]{2})([0-9a-f]{6})$/i.exec(value);
  if (!match) return undefined;
  const alpha = Number.parseInt(match[1] ?? "ff", 16) / 255;
  const rgb = Number.parseInt(match[2] ?? "0", 16);
  return `rgb(${(rgb >> 16) & 255} ${(rgb >> 8) & 255} ${rgb & 255} / ${alpha.toFixed(2)})`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** `com.example.Thing` → `Thing`. */
export function simpleName(type: string): string {
  return type.slice(type.lastIndexOf(".") + 1);
}
