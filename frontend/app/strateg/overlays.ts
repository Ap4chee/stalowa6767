// Cesium overlays for STRATEG AI visualizations.
// Renders predicted attack vectors as orange arrowed parabolas, and
// vulnerability halos as pulsing red ellipses around at-risk nodes.

import type { PredictedVectorSchema, VulnerabilitySchema } from "./schemas";
import type { z } from "zod";

type PredictedVector = z.infer<typeof PredictedVectorSchema>;
type Vulnerability = z.infer<typeof VulnerabilitySchema>;

interface NodeCoord {
  id: string;
  lat: number;
  lon: number;
  name: string;
}

const STRATEG_TAG = "STRATEG_OVERLAY";
const PEAK_ALT = 400;
const ARC_STEPS = 36;

function geodesicArc(
  Cesium: any,
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  peakAlt: number
) {
  // Parabolic arc with peakAlt at midpoint, descending at endpoints
  const positions: number[] = [];
  for (let i = 0; i <= ARC_STEPS; i++) {
    const t = i / ARC_STEPS;
    const lat = fromLat + (toLat - fromLat) * t;
    const lon = fromLon + (toLon - fromLon) * t;
    const alt = 4 * peakAlt * t * (1 - t);
    positions.push(lon, lat, alt);
  }
  return Cesium.Cartesian3.fromDegreesArrayHeights(positions);
}

export function drawStrategOverlays(
  viewer: any,
  vectors: PredictedVector[],
  vulnerabilities: Vulnerability[],
  nodes: NodeCoord[]
) {
  if (!viewer || !(window as any).Cesium) return;
  const Cesium = (window as any).Cesium;

  clearStrategOverlays(viewer);

  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // ---- Vulnerability halos ----
  for (const v of vulnerabilities) {
    const node = nodeById.get(v.nodeId);
    if (!node) continue;

    const intensity = Math.min(1, v.riskScore / 100);
    const radius = 380 + intensity * 320; // 380-700m
    const haloColor = Cesium.Color.fromCssColorString("#ef4444");

    viewer.entities.add({
      id: `${STRATEG_TAG}_HALO_${v.nodeId}`,
      tag: STRATEG_TAG,
      position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 0),
      ellipse: {
        semiMajorAxis: radius,
        semiMinorAxis: radius,
        material: haloColor.withAlpha(0.16 + 0.10 * intensity),
        outline: true,
        outlineColor: haloColor.withAlpha(0.65),
        outlineWidth: 2,
        height: 2,
        heightReference: Cesium.HeightReference.NONE
      }
    });

    viewer.entities.add({
      id: `${STRATEG_TAG}_HALO_RING_${v.nodeId}`,
      tag: STRATEG_TAG,
      position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 0),
      ellipse: {
        semiMajorAxis: radius * 1.55,
        semiMinorAxis: radius * 1.55,
        material: haloColor.withAlpha(0.0),
        outline: true,
        outlineColor: haloColor.withAlpha(0.35),
        outlineWidth: 1.2,
        height: 2
      }
    });

    // Rank label
    viewer.entities.add({
      id: `${STRATEG_TAG}_HALO_LBL_${v.nodeId}`,
      tag: STRATEG_TAG,
      position: Cesium.Cartesian3.fromDegrees(node.lon, node.lat, 220),
      label: {
        text: `#${v.rank}  ·  risk ${Math.round(v.riskScore)}`,
        font: "600 13px 'Inter', system-ui, sans-serif",
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: haloColor.withAlpha(0.85),
        backgroundPadding: new Cesium.Cartesian2(8, 5),
        pixelOffset: new Cesium.Cartesian2(0, -28),
        style: Cesium.LabelStyle.FILL,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }

  // ---- Predicted attack vectors ----
  for (const vec of vectors) {
    const target = nodeById.get(vec.targetNodeId);
    if (!target) continue;

    const arcColor = Cesium.Color.fromCssColorString("#f97316"); // orange-500
    const positions = geodesicArc(
      Cesium,
      vec.approachFromLat,
      vec.approachFromLon,
      target.lat,
      target.lon,
      PEAK_ALT
    );

    // Glow underlay
    viewer.entities.add({
      id: `${STRATEG_TAG}_VEC_GLOW_${vec.id}`,
      tag: STRATEG_TAG,
      polyline: {
        positions,
        width: 9,
        material: arcColor.withAlpha(0.18),
        arcType: Cesium.ArcType.NONE
      }
    });

    // Dashed core — arrow style with material image
    viewer.entities.add({
      id: `${STRATEG_TAG}_VEC_CORE_${vec.id}`,
      tag: STRATEG_TAG,
      polyline: {
        positions,
        width: 3,
        material: new Cesium.PolylineDashMaterialProperty({
          color: arcColor.withAlpha(0.95),
          dashLength: 18.0,
          dashPattern: 0xff00
        }),
        arcType: Cesium.ArcType.NONE
      }
    });

    // Origin marker
    viewer.entities.add({
      id: `${STRATEG_TAG}_VEC_ORIGIN_${vec.id}`,
      tag: STRATEG_TAG,
      position: Cesium.Cartesian3.fromDegrees(vec.approachFromLon, vec.approachFromLat, 0),
      point: {
        pixelSize: 10,
        color: arcColor,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: `${vec.threatType} · ${vec.likelihood}%`,
        font: "500 11px 'JetBrains Mono', monospace",
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: arcColor.withAlpha(0.85),
        backgroundPadding: new Cesium.Cartesian2(6, 3),
        pixelOffset: new Cesium.Cartesian2(12, -10),
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }
}

export function clearStrategOverlays(viewer: any) {
  if (!viewer) return;
  // Iterate and remove anything with our id prefix
  const toRemove: any[] = [];
  for (let i = 0; i < viewer.entities.values.length; i++) {
    const e = viewer.entities.values[i];
    if (e?.id && typeof e.id === "string" && e.id.startsWith(STRATEG_TAG)) {
      toRemove.push(e);
    }
  }
  for (const e of toRemove) viewer.entities.remove(e);
}

/**
 * Capture the Cesium viewer canvas as a base64 PNG.
 * Forces a render so the latest frame is captured.
 * Returns base64 string WITHOUT the data URL prefix.
 */
export async function captureCesiumScreenshot(viewer: any): Promise<string | null> {
  if (!viewer) return null;
  try {
    viewer.scene.render();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const canvas = viewer.scene.canvas as HTMLCanvasElement;
    const dataUrl = canvas.toDataURL("image/png");
    // Strip "data:image/png;base64," prefix
    const commaIdx = dataUrl.indexOf(",");
    return commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  } catch (e) {
    console.warn("Cesium screenshot failed", e);
    return null;
  }
}
