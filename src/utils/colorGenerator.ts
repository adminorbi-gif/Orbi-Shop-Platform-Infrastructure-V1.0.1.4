export interface NicheColorInfo {
  hue: number;
  textClass: string;
  bgClass: string;
  hoverBgClass: string;
  borderClass: string;
  gradientClass: string;
  bannerBgClass: string;
  css: string;
}

export function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function generateNicheColorMap(
  nicheNames: string[],
  persistedHues: Record<string, number>
): { colorMap: Record<string, NicheColorInfo>; updatedHues: Record<string, number>; combinedCss: string } {
  const updatedHues = { ...persistedHues };
  
  // Clean names (remove Zote/All from being styled or just include them as neutral)
  const namesToProcess = nicheNames.filter(n => n !== "Zote" && n !== "All" && n !== "Mengineyo");

  for (const name of namesToProcess) {
    if (updatedHues[name] === undefined) {
      const existingHues = Object.values(updatedHues).sort((a, b) => a - b);
      if (existingHues.length === 0) {
        // Initial assignment based on hash
        const hash = getStringHash(name);
        updatedHues[name] = hash % 360;
      } else {
        // Find largest gap on the color wheel
        let maxGap = 0;
        let gapStart = 0;
        let gapEnd = 360;

        for (let i = 0; i < existingHues.length; i++) {
          const current = existingHues[i];
          const next = existingHues[(i + 1) % existingHues.length];
          let gap = next - current;
          if (gap < 0) gap += 360; // circular gap
          if (gap > maxGap) {
            maxGap = gap;
            gapStart = current;
            gapEnd = next;
          }
        }

        // Place in middle of the largest gap
        let newHue = (gapStart + maxGap / 2) % 360;

        // If the gap is large enough (> 40), let's see if the hash-preferred hue fits nicely
        if (maxGap > 40) {
          const preferred = getStringHash(name) % 360;
          let inGap = false;
          if (gapStart < gapEnd) {
            inGap = preferred > gapStart + 15 && preferred < gapEnd - 15;
          } else {
            inGap = preferred > gapStart + 15 || preferred < gapEnd - 15;
          }
          if (inGap) {
            newHue = preferred;
          }
        }

        updatedHues[name] = Math.round(newHue);
      }
    }
  }

  // Also make sure Mengineyo has a nice default or assigned color if not already
  if (nicheNames.includes("Mengineyo") && updatedHues["Mengineyo"] === undefined) {
    updatedHues["Mengineyo"] = 280; // Nice purple/indigo fallback
  }

  const colorMap: Record<string, NicheColorInfo> = {};
  let combinedCss = "";

  for (const name of nicheNames) {
    // If name is Zote or All, use a default neutral style
    if (name === "Zote" || name === "All") {
      colorMap[name] = {
        hue: 200,
        textClass: "text-slate-700",
        bgClass: "bg-slate-50",
        hoverBgClass: "hover:bg-slate-100",
        borderClass: "border-slate-200",
        gradientClass: "bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent",
        bannerBgClass: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950",
        css: ""
      };
      continue;
    }

    const hue = updatedHues[name] !== undefined ? updatedHues[name] : (getStringHash(name) % 360);
    const safeName = name.replace(/[^\w]/g, "-").toLowerCase();
    
    const textClass = `text-niche-dyn-${safeName}`;
    const bgClass = `bg-niche-dyn-${safeName}`;
    const hoverBgClass = `hover-bg-niche-dyn-${safeName}`;
    const borderClass = `border-niche-dyn-${safeName}`;
    const gradientClass = `gradient-niche-dyn-${safeName}`;
    const bannerBgClass = `banner-bg-niche-dyn-${safeName}`;

    // Compute hues for the gradient/theme
    const h1 = hue;
    const h2 = (hue + 30) % 360;
    const h3 = (hue + 60) % 360;

    const css = `
      .${textClass} {
        color: hsl(${h1}, 75%, 40%) !important;
      }
      .group:hover .${textClass} {
        color: hsl(${h2}, 85%, 35%) !important;
      }
      .${bgClass} {
        background-color: hsl(${h1}, 90%, 97%) !important;
        color: hsl(${h1}, 75%, 40%) !important;
      }
      .group:hover .${bgClass} {
        background-color: hsl(${h1}, 90%, 93%) !important;
        color: hsl(${h2}, 85%, 35%) !important;
      }
      .${hoverBgClass}:hover {
        background-color: hsl(${h1}, 90%, 94%) !important;
      }
      .${borderClass} {
        border-color: hsl(${h1}, 45%, 90%) !important;
      }
      .group:hover .${borderClass} {
        border-color: hsl(${h1}, 55%, 82%) !important;
      }
      .${gradientClass} {
        background-image: linear-gradient(to right, hsl(${h1}, 100%, 75%), hsl(${h2}, 100%, 80%), hsl(${h3}, 100%, 75%)) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        text-fill-color: transparent !important;
      }
      .${bannerBgClass} {
        background-image: linear-gradient(to bottom right, hsl(${h1}, 65%, 22%), hsl(${h2}, 60%, 15%), hsl(${h3}, 70%, 12%)) !important;
      }
    `;

    colorMap[name] = {
      hue,
      textClass,
      bgClass,
      hoverBgClass,
      borderClass,
      gradientClass,
      bannerBgClass,
      css
    };

    combinedCss += css + "\n";
  }

  return { colorMap, updatedHues, combinedCss };
}
