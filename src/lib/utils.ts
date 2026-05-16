import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);

  return `${prefix}_${random}`;
}

export function toFieldName(label: string) {
  const words = label
    .trim()
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "field";
  }

  return words
    .map((word, index) => {
      const normalized = word.toLowerCase();
      return index === 0 ? normalized : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");
}

export function uniqueFieldName(baseName: string, existingNames: string[]) {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let suffix = 2;
  while (existingNames.includes(`${baseName}${suffix}`)) {
    suffix += 1;
  }

  return `${baseName}${suffix}`;
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
