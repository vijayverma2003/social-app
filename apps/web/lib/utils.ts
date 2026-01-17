import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a hex color to RGB values
 * @param hex - Hex color string (e.g., "#ffffff" or "#fff")
 * @returns RGB values as [r, g, b] or null if invalid
 */
function hexToRgb(hex: string): [number, number, number] | null {
  // Remove # if present
  const cleanHex = hex.replace("#", "");
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }
  
  return null;
}

/**
 * Calculates the relative luminance of a color
 * Uses the formula from WCAG 2.1: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance (0-1)
 */
function getLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Checks whether a color is light or dark
 * @param color - Color string in hex format (e.g., "#ffffff" or "#fff")
 * @returns true if the color is light, false if dark
 */
export function isLightColor(color: string): boolean {
  if (!color) return false;
  
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  
  const [r, g, b] = rgb;
  // const luminance = getLuminance(r, g, b);
  
  // // Threshold of 0.5 - colors above are considered light, below are dark
  // return luminance > 0.25;

  // Calculate luminance using the W3C formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? true : false;
}
