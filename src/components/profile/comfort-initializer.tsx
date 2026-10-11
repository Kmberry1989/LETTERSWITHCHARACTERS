"use client";

import { useComfortSettings } from "@/hooks/use-comfort-settings";

// Applies saved comfort settings to <html> on every page load.
// The hook itself handles reading localStorage and setting data attributes.
export function ComfortInitializer() {
  useComfortSettings();
  return null;
}
