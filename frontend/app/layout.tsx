import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STEEL SENTINEL — Command & Control",
  description: "Tactical Common Operational Picture for critical infrastructure defense — Stalowa Wola",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* Speed up Cesium asset/tile fetches by warming the DNS + TCP connection early */}
        <link rel="preconnect" href="https://cesium.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://assets.ion.cesium.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.cesium.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tile.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://services.arcgisonline.com" />
        <link rel="dns-prefetch" href="https://basemaps.cartocdn.com" />

        {/* CesiumJS CDN — `defer` lets the rest of the HTML parse first so React mounts faster */}
        <link href="https://cesium.com/downloads/cesiumjs/releases/1.118/Build/Cesium/Widgets/widgets.css" rel="stylesheet" />
        <script src="https://cesium.com/downloads/cesiumjs/releases/1.118/Build/Cesium/Cesium.js" defer></script>
      </head>
      <body className="h-full w-full flex flex-col overflow-hidden">
        {children}
      </body>
    </html>
  );
}
