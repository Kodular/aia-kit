import {
  Bell,
  Box,
  Clock,
  Columns3,
  File,
  FileText,
  Film,
  Globe,
  Image,
  List,
  Music,
  Puzzle,
  RectangleHorizontal,
  Rows3,
  Smartphone,
  SquareCheck,
  Table2,
  TextCursorInput,
  Type,
  Volume2,
} from "lucide";
import type { IconData } from "../components/ui/index.ts";
import { extensionOf, mimeOf } from "../state.ts";
import { simpleName } from "./format.ts";

const TEXT_TYPES = new Set([
  "txt",
  "json",
  "csv",
  "xml",
  "html",
  "htm",
  "js",
  "css",
  "md",
  "svg",
  "yail",
]);

export function isTextAsset(name: string): boolean {
  return TEXT_TYPES.has(extensionOf(name));
}

export function assetIcon(name: string): IconData {
  const mime = mimeOf(name);
  if (mime.startsWith("image/")) return Image;
  if (mime.startsWith("audio/")) return Music;
  if (mime.startsWith("video/")) return Film;
  return isTextAsset(name) ? FileText : File;
}

const COMPONENT_ICONS: Readonly<Record<string, IconData>> = {
  Form: Smartphone,
  Button: RectangleHorizontal,
  Label: Type,
  Image,
  CheckBox: SquareCheck,
  Switch: SquareCheck,
  ListView: List,
  WebViewer: Globe,
  Clock,
  Sound: Volume2,
  Player: Volume2,
  Notifier: Bell,
  TableArrangement: Table2,
};

/** An icon for a component type; extension components get the puzzle piece. */
export function componentIcon(type: string): IconData {
  const name = simpleName(type);
  const known = COMPONENT_ICONS[name];
  if (known) return known;
  if (name.endsWith("TextBox")) return TextCursorInput;
  if (name.includes("Arrangement")) return name.startsWith("Horizontal") ? Columns3 : Rows3;
  return type.includes(".") ? Puzzle : Box;
}
