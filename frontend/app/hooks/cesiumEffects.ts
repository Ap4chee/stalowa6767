// Subtle combat effects for Cesium scene: a soft on-map representation of
// impacts and intercepts. No screen flashes, no camera shake — every effect
// stays inside the 3D scene and fades quickly.

const GROUND_ALT = 155;

export type ActiveEffect = {
  ids: string[];
  spawnAt: number;
  duration: number;
};

type ThreatType = "DRONE" | "SHAHED" | "MISSILE";
type SystemType = "PILICA" | "PATRIOT" | "WRE" | "RADAR";

function rand(seed = 0): number {
  return Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
}

// Impact effect: small ember flash + thin smoke plume + faint scorch mark.
// Intentionally restrained — readable as "something happened here" without
// dominating the scene.
export function spawnImpactExplosion(
  viewer: any,
  Cesium: any,
  lon: number,
  lat: number,
  threatType: ThreatType
): ActiveEffect[] {
  const now = performance.now();
  const effects: ActiveEffect[] = [];

  const scale = threatType === "MISSILE" ? 1.0 : threatType === "SHAHED" ? 0.85 : 0.65;

  // 1. Ember flash — short, soft amber pulse
  const flashId = `FX_IMPACT_FLASH_${now}_${Math.random().toString(36).slice(2)}`;
  const flashDuration = 500;
  viewer.entities.add({
    id: flashId,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + 18),
    ellipsoid: {
      radii: new Cesium.CallbackProperty(() => {
        const t = Math.min(1, (performance.now() - now) / flashDuration);
        const eased = 1 - Math.pow(1 - t, 2);
        const r = (20 + eased * 70) * scale;
        return new Cesium.Cartesian3(r, r, r * 0.85);
      }, false),
      material: new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(() => {
          const t = Math.min(1, (performance.now() - now) / flashDuration);
          return new Cesium.Color(1.0, 0.7 - t * 0.3, 0.25, Math.max(0, (1 - t) * 0.55));
        }, false)
      )
    }
  });
  effects.push({ ids: [flashId], spawnAt: now, duration: flashDuration + 100 });

  // 2. Thin smoke plume — 3 layered puffs rising gently
  const smokeDuration = 5500;
  const smokeIds: string[] = [];
  const layerCount = 3;
  for (let i = 0; i < layerCount; i++) {
    const smokeId = `FX_IMPACT_SMOKE_${now}_${i}`;
    const layerDelay = i * 380;
    const driftLon = (rand(i * 13) - 0.5) * 0.00015 * scale;
    const driftLat = (rand(i * 31) - 0.5) * 0.00015 * scale;

    viewer.entities.add({
      id: smokeId,
      position: new Cesium.CallbackProperty(() => {
        const elapsed = performance.now() - now - layerDelay;
        if (elapsed < 0) return Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT - 5000);
        const t = Math.min(1, elapsed / smokeDuration);
        const eased = Math.pow(t, 0.65);
        const rise = 25 + eased * (140 + i * 45);
        return Cesium.Cartesian3.fromDegrees(lon + driftLon * t, lat + driftLat * t, GROUND_ALT + rise);
      }, false),
      ellipsoid: {
        radii: new Cesium.CallbackProperty(() => {
          const elapsed = performance.now() - now - layerDelay;
          if (elapsed < 0) return new Cesium.Cartesian3(0.1, 0.1, 0.1);
          const t = Math.min(1, elapsed / smokeDuration);
          const r = (30 + t * 70 + i * 8) * scale;
          return new Cesium.Cartesian3(r, r, r * 0.95);
        }, false),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const elapsed = performance.now() - now - layerDelay;
            if (elapsed < 0) return new Cesium.Color(0, 0, 0, 0);
            const t = Math.min(1, elapsed / smokeDuration);
            const fade = t < 0.18 ? t / 0.18 : (1 - t) / 0.82;
            const gray = 0.22 + i * 0.04 + t * 0.18;
            return new Cesium.Color(gray + 0.03, gray + 0.01, gray, fade * 0.45);
          }, false)
        )
      }
    });
    smokeIds.push(smokeId);
  }
  effects.push({ ids: smokeIds, spawnAt: now, duration: smokeDuration + 400 });

  // 3. Faint scorch mark — thin dark ellipse on ground, fades over 14 s
  const craterId = `FX_IMPACT_SCORCH_${now}_${Math.random().toString(36).slice(2)}`;
  const craterDuration = 14000;
  const craterRadius = 38 * scale;
  viewer.entities.add({
    id: craterId,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, GROUND_ALT + 0.4),
    ellipse: {
      semiMajorAxis: craterRadius,
      semiMinorAxis: craterRadius * 0.92,
      material: new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(() => {
          const t = Math.min(1, (performance.now() - now) / craterDuration);
          return new Cesium.Color(0.09, 0.06, 0.05, 0.45 - t * 0.35);
        }, false)
      ),
      outline: false,
      height: GROUND_ALT + 0.4
    }
  });
  effects.push({ ids: [craterId], spawnAt: now, duration: craterDuration });

  return effects;
}

// Intercept effect: a small mid-air glint that fades quickly. PILICA/PATRIOT
// get a single warm point of light; WRE jam is handled separately (falling
// drone). No screen response, no debris cascade.
export function spawnInterceptBurst(
  viewer: any,
  Cesium: any,
  lon: number,
  lat: number,
  alt: number,
  systemType: SystemType
): ActiveEffect[] {
  const now = performance.now();
  const effects: ActiveEffect[] = [];
  const baseAlt = GROUND_ALT + alt;

  const palette: Record<string, [number, number, number]> = {
    PILICA:  [1.0, 0.82, 0.4],
    PATRIOT: [0.95, 0.7, 1.0],
    WRE:     [0.5, 0.78, 1.0],
    RADAR:   [0.55, 0.85, 1.0]
  };
  const [pr, pg, pb] = palette[systemType] || palette.PILICA;

  // Small glint
  const flashId = `FX_INT_FLASH_${now}_${Math.random().toString(36).slice(2)}`;
  const flashDuration = 260;
  viewer.entities.add({
    id: flashId,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, baseAlt),
    ellipsoid: {
      radii: new Cesium.CallbackProperty(() => {
        const t = Math.min(1, (performance.now() - now) / flashDuration);
        const eased = 1 - Math.pow(1 - t, 2);
        const r = 6 + eased * 20;
        return new Cesium.Cartesian3(r, r, r);
      }, false),
      material: new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(() => {
          const t = Math.min(1, (performance.now() - now) / flashDuration);
          return new Cesium.Color(pr, pg, pb, Math.max(0, (1 - t) * 0.7));
        }, false)
      )
    }
  });
  effects.push({ ids: [flashId], spawnAt: now, duration: flashDuration + 80 });

  // Thin drifting puff for kinetic kills only (WRE jam stays clean)
  if (systemType !== "WRE") {
    const puffId = `FX_INT_PUFF_${now}_${Math.random().toString(36).slice(2)}`;
    const puffDuration = 1600;
    viewer.entities.add({
      id: puffId,
      position: new Cesium.CallbackProperty(() => {
        const t = Math.min(1, (performance.now() - now) / puffDuration);
        return Cesium.Cartesian3.fromDegrees(lon, lat, baseAlt + t * 25);
      }, false),
      ellipsoid: {
        radii: new Cesium.CallbackProperty(() => {
          const t = Math.min(1, (performance.now() - now) / puffDuration);
          const r = 10 + t * 22;
          return new Cesium.Cartesian3(r, r, r);
        }, false),
        material: new Cesium.ColorMaterialProperty(
          new Cesium.CallbackProperty(() => {
            const t = Math.min(1, (performance.now() - now) / puffDuration);
            const fade = t < 0.25 ? t / 0.25 : (1 - t) / 0.75;
            return new Cesium.Color(0.34, 0.32, 0.31, fade * 0.4);
          }, false)
        )
      }
    });
    effects.push({ ids: [puffId], spawnAt: now, duration: puffDuration + 80 });
  }

  return effects;
}

// Drone tumble after WRE jam — keeps the carcass visible briefly with a
// short trail so the scene reads as "jammed, falling" instead of vanishing.
export function spawnFallingDrone(
  viewer: any,
  Cesium: any,
  startLon: number,
  startLat: number,
  startAlt: number
): ActiveEffect[] {
  const now = performance.now();
  const fallDuration = 2000;
  const modelId = `FX_FALL_MODEL_${now}_${Math.random().toString(36).slice(2)}`;
  const trailId = `FX_FALL_TRAIL_${now}_${Math.random().toString(36).slice(2)}`;
  const trailPositions: any[] = [];

  const fallPosition = (): { pos: any } => {
    const t = Math.min(1, (performance.now() - now) / fallDuration);
    const altMeters = Math.max(0, startAlt - t * t * startAlt - t * 3);
    const lonOff = startLon + t * 0.0005;
    const latOff = startLat - t * 0.00025;
    return { pos: Cesium.Cartesian3.fromDegrees(lonOff, latOff, GROUND_ALT + altMeters) };
  };

  viewer.entities.add({
    id: modelId,
    position: new Cesium.CallbackProperty(() => {
      const { pos } = fallPosition();
      trailPositions.push(pos);
      if (trailPositions.length > 24) trailPositions.shift();
      return pos;
    }, false),
    orientation: new Cesium.CallbackProperty(() => {
      const t = Math.min(1, (performance.now() - now) / fallDuration);
      const { pos } = fallPosition();
      const heading = t * Math.PI * 5;
      const pitch = -t * Math.PI * 0.25;
      const roll = Math.sin(t * 9) * 0.45;
      return Cesium.Transforms.headingPitchRollQuaternion(
        pos,
        new Cesium.HeadingPitchRoll(heading, pitch, roll)
      );
    }, false),
    model: {
      uri: "/3d_models/fpv_drone.glb",
      scale: 15,
      minimumPixelSize: 28,
      maximumScale: 60,
      color: Cesium.Color.fromCssColorString("#94a3b8"),
      colorBlendMode: Cesium.ColorBlendMode.MIX,
      colorBlendAmount: 0.45,
      silhouetteColor: Cesium.Color.fromCssColorString("#60a5fa"),
      silhouetteSize: 1.0
    }
  });

  viewer.entities.add({
    id: trailId,
    polyline: {
      positions: new Cesium.CallbackProperty(() => trailPositions.slice(), false),
      width: 2,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        taperPower: 0.6,
        color: Cesium.Color.fromCssColorString("#60a5fa").withAlpha(0.4)
      })
    }
  });

  return [{ ids: [modelId, trailId], spawnAt: now, duration: fallDuration + 200 }];
}

// Clean up an effect's entities by ID. Safe to call repeatedly.
export function disposeEffect(viewer: any, eff: ActiveEffect): void {
  eff.ids.forEach((id) => {
    const ent = viewer.entities.getById(id);
    if (ent) viewer.entities.remove(ent);
  });
}
