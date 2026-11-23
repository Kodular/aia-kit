/**
 * App Inventor stores many designer properties as codes: a width of `-2`
 * means "fill parent", an alignment of `3` means "centre". These helpers turn
 * a stored value into what the designer shows.
 */

/** Coded values by the property's editor type, as named in the component descriptors. */
const BY_EDITOR: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  horizontal_alignment: { "1": "Left", "2": "Right", "3": "Center" },
  vertical_alignment: { "1": "Top", "2": "Center", "3": "Bottom" },
  textalignment: { "0": "Left", "1": "Center", "2": "Right" },
  button_shape: { "0": "Default", "1": "Rounded", "2": "Rectangular", "3": "Oval" },
  typeface: { "0": "Default", "1": "Sans serif", "2": "Serif", "3": "Monospace" },
  accelerometer_sensitivity: { "1": "Weak", "2": "Moderate", "3": "Strong" },
  toast_length: { "0": "Short", "1": "Long" },
  text_receiving: { "1": "Off", "2": "Foreground", "3": "Always" },
};

/** The same, by property name, for when no descriptor is available. */
const EDITOR_BY_NAME: Readonly<Record<string, string>> = {
  AlignHorizontal: "horizontal_alignment",
  AlignVertical: "vertical_alignment",
  TextAlignment: "textalignment",
  Shape: "button_shape",
  FontTypeface: "typeface",
  Sensitivity: "accelerometer_sensitivity",
  NotifierLength: "toast_length",
};

/** `-1` automatic, `-2` fill parent, `-1000 - n` percent, otherwise pixels. */
function describeSize(value: string): string | undefined {
  const n = Number(value);
  if (value.trim() === "" || !Number.isFinite(n)) return undefined;
  if (n === -1) return "Automatic";
  if (n === -2) return "Fill parent";
  if (n <= -1000) return `${-n - 1000}%`;
  return n >= 0 ? `${n} px` : undefined;
}

/** Two colour values have a meaning beyond their channels. */
const NAMED_COLORS: Readonly<Record<string, string>> = {
  "&H00FFFFFF": "None",
  "&H00000000": "Default",
};

/**
 * What the designer would show for a stored property value, or `undefined`
 * when the stored value is already what a person would read.
 */
export function describeProperty(
  name: string,
  value: string,
  editorType?: string,
): string | undefined {
  if (name === "Width" || name === "Height") return describeSize(value);
  const named = NAMED_COLORS[value.toUpperCase()];
  if (named) return named;
  const codes = BY_EDITOR[editorType ?? ""] ?? BY_EDITOR[EDITOR_BY_NAME[name] ?? ""];
  return codes?.[value];
}
