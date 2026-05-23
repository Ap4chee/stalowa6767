# AI Design Prompt - STEEL SENTINEL (DefenseTech UI/UX)

Zebrałem poniżej bardzo szczegółowe prompty. Pierwszy to prompt wizualny (np. do Midjourney / DALL-E) służący do wygenerowania koncepcji i "moodboardu". Drugi to prompt strukturalny, idealny do narzędzi generujących kod UI (np. v0.dev od Vercel, Bolt.new lub Lovable), aby od razu wypluły gotowe komponenty React + Tailwind.

---

## 1. PROMPT WIZUALNY (Midjourney / DALL-E)
*Wklej to do generatora obrazków, aby uzyskać referencje designu, kolory i układ elementów.*

**Prompt:**
> UI/UX design of a futuristic military Command and Control (C2) dashboard, Digital Twin software for homeland security, aerospace defense monitor. Dark mode, deep matte obsidian and navy background. Neon glowing accents: cyan, crimson red, and toxic green. Layout features a central 3D topographical map with glowing translucent defense dome spheres protecting city infrastructure. Left panel: high-tech cascading failure node graph (cyberpunk style). Right panel: weapon systems arsenal selector. Bottom right: glowing terminal log with monospace typography. Hard edges, clipped corners (chamfered UI), glassmorphism, HUD elements, military targeting crosshairs, tactical data overlays. Typography: monospace, technical. Highly detailed, 8k resolution, Figma design, Dribbble winner, sleek, professional DefenseTech interface, Unreal Engine 5 render style. --ar 16:9 --v 6.0

---

## 2. PROMPT DO GENERATORÓW KODU UI (v0.dev / Bolt / Lovable)
*Wklej to do AI generującego od razu UI w React/Next.js + TailwindCSS (polecam v0.dev).*

**Prompt:**
> Act as an Expert military UI/UX Designer and Frontend Developer. 
> Create a sophisticated "Command and Control" (C2) dashboard called "STEEL SENTINEL" for drone and missile defense. The entire UI must be dark, aggressive, and highly technical (military/cyberpunk aesthetic).
>
> **Global Styles & Theme:**
> - Background: extremely dark slate/obsidian (`bg-slate-950`).
> - Colors: Neon Cyan for primary actions, Crimson Red for critical threats/destroyed targets, Toxic Green for operational status.
> - Borders & Shapes: Hard angles, no rounded corners (`rounded-none`). Use CSS `clip-path` for chamfered/cut corners on panels. Add subtle glowing borders.
> - Font: Use 'Rajdhani' or a similar technical sans-serif for headers, and strict Monospace (like JetBrains Mono or Share Tech Mono) for numbers and logs.
> - Overlay: A very subtle scanline/CRT effect over the whole screen.
> 
> **Layout Structure (Full Screen App):**
> 1. **Center / Main Area:** Leave a massive empty div for a 3D Map (Cesium.js will go here). Overlay targeting crosshairs in the center and a small "HUD" compass at the top.
> 2. **Top Bar (Header):** DEFCON level indicator (pulsing red), current time (military format UTC), and a scrolling ticker tape of active threats.
> 3. **Left Panel (Infrastructure Status):** A vertical list or visual node tree of 7 critical infrastructure icons (Power Plant, Foundry, Water Supply, etc.). Show health bars. Some are green (Operational) and one is flashing red (Under Attack). 
> 4. **Right Panel (Defense Arsenal):** A toolbox panel. 3 distinct weapon system cards: "PSR-A PILICA" (Kinetic), "WRE JAMMER" (Electronic Warfare), "RADAR". They must look like draggable items with detailed stats (Range: 5000m, Status: Ready).
> 5. **Bottom Right (Live Combat Log):** A terminal-style console window. Black background with green monospace text. Show 3-4 lines of military logs like: "[15:42:01.22] THREAT DETECTED: SHAHED-136 IN SECTOR 7", "[15:42:05.88] WRE INTERFERENCE ENGAGED". Include a blinking cursor.
> 
> Make it look like a real, expensive DefenseTech software interface used by the military. Use Lucide-react for sharp, minimalist icons (Target, Shield, Radio, ShieldAlert). Do not use soft, friendly, or consumer UI patterns. It must look lethal and precise.