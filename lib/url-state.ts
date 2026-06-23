// Spec Forge — URL State Encoding
//
// Encodes/decodes wizard decisions to/from base64 for URL sharing.
// Selections only (small); description text goes through KV store.

export interface ShareState {
  decisions: Record<string, string>;
}

/**
 * Encode decision selections to a URL-safe base64 string.
 */
export function encodeState(decisions: Record<string, string>): string {
  const json = JSON.stringify(decisions);
  // Use Buffer in Node, btoa in browser
  if (typeof window === "undefined") {
    return Buffer.from(json, "utf-8").toString("base64url");
  }
  // Browser: btoa with unicode-safe encoding
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a base64 string back to decision selections.
 * Returns null if the input is invalid (not a crash).
 */
export function decodeState(encoded: string): ShareState | null {
  try {
    let json: string;
    if (typeof window === "undefined") {
      json = Buffer.from(encoded, "base64url").toString("utf-8");
    } else {
      // Browser: atob with unicode-safe decoding
      const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      json = new TextDecoder().decode(bytes);
    }
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return { decisions: parsed as Record<string, string> };
  } catch {
    return null;
  }
}
