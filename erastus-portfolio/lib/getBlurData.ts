import { getPlaiceholder } from "plaiceholder";
import fs from "fs";
import path from "path";

export async function getBlurDataURL(src: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "public", src);
    const buffer = fs.readFileSync(filePath);
    const { base64 } = await getPlaiceholder(buffer, { size: 32 });
    return base64;
  } catch (e) {
    console.error(`Failed to generate blur for ${src}:`, e);
    // Fallback: a tiny transparent grey placeholder
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }
}
