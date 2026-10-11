import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "WAFA Group — We Are For All. A member-owned savings and credit cooperative in Nepal.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Child pages that set their own openGraph object reference this route
// directly (see OG_IMAGE in lib/seo.ts), since that replaces the inherited image.
export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.jpeg"));
  const logoSrc = `data:image/jpeg;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #f7f8f4 0%, #eef4ef 55%, #e3efe8 100%)",
          color: "#14201b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "rgba(31,103,82,0.14)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: 420,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(217,138,43,0.12)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={96} height={96} alt="" style={{ borderRadius: 22 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>WAFA Group</span>
            <span style={{ fontSize: 22, color: "#1f6752", letterSpacing: 6, textTransform: "uppercase" }}>
              We Are For All
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
            Save together. Borrow responsibly. Grow for all.
          </span>
          <span style={{ marginTop: 24, fontSize: 28, color: "#5b6b63", lineHeight: 1.4 }}>
            A member-owned savings and credit cooperative in Nepal.
          </span>
        </div>

        <div style={{ display: "flex", height: 8, width: 160, borderRadius: 9999, background: "#1f6752" }} />
      </div>
    ),
    size,
  );
}
