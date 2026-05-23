import { useEffect, MutableRefObject } from "react";
import { CriticalNode } from "../types";

export function useCascadingEngine(
  nodes: CriticalNode[],
  setNodes: (fn: (prev: CriticalNode[]) => CriticalNode[]) => void,
  simSpeed: number,
  coolingSecondsLeft: number | null,
  setCoolingSecondsLeft: (n: number | null) => void,
  waterSecondsLeft: number | null,
  setWaterSecondsLeft: (n: number | null) => void,
  addLog: (text: string, type: "info" | "success" | "warning" | "error" | "combat") => void,
  nodeEntitiesRef: MutableRefObject<{ [id: string]: any }>
) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (simSpeed === 0) return;

      const nodeMap = { ...nodes.reduce((acc, n) => ({ ...acc, [n.id]: n }), {} as { [id: string]: CriticalNode }) };
      let changed = false;

      const elektrownia = nodeMap["OBJ_02"];
      const huta = nodeMap["OBJ_01"];
      const woda = nodeMap["OBJ_03"];

      if (elektrownia.status === "DESTROYED" || elektrownia.status === "DEGRADED") {
        if (huta.health > 15) {
          const newHutaHealth = Math.max(15, huta.health - 5 * simSpeed);
          nodeMap["OBJ_01"] = {
            ...huta,
            health: newHutaHealth,
            status: "DEGRADED",
            notes: "KRYTYCZNE: Spadek zasilania! Awaryjne generatory podtrzymują piec na 15%."
          };
          changed = true;
          if (newHutaHealth === 15) {
            addLog("OBJ_01 (Huta Stalowa Wola): Utrata zasilania sieciowego ustabilizowana na 15% mocy.", "warning");
          }
        }

        if (woda.status === "OPERATIONAL" && waterSecondsLeft === null) {
          addLog("OBJ_03 (Ujęcie Wody): Pompy sieciowe odłączone z braku zasilania z Elektrowni! Rozpoczęto awaryjny drenaż rezerw (Zapas: 12h).", "error");
          setWaterSecondsLeft(12);
          changed = true;
        }
      }

      if (waterSecondsLeft !== null && waterSecondsLeft > 0) {
        const nextTime = Math.max(0, waterSecondsLeft - 1 * simSpeed);
        setWaterSecondsLeft(nextTime);
        if (nextTime === 0) {
          nodeMap["OBJ_03"] = {
            ...woda,
            health: 0,
            status: "DESTROYED",
            notes: "ZATRZYMANIE PUMP: Zbiorniki rezerwowe puste. Brak wody do celów chłodniczych i komunalnych."
          };
          changed = true;
          addLog("OBJ_03 (Ujęcie Wody): CAŁKOWITY PARALIŻ - zbiorniki puste!", "error");
          setWaterSecondsLeft(null);
        }
      }

      if (woda.status === "DESTROYED" || woda.status === "DEGRADED") {
        if (elektrownia.status === "OPERATIONAL" && coolingSecondsLeft === null) {
          addLog("OBJ_02 (Elektrownia): Alarm wysokiej temperatury bloku gazowego! Odcięcie dopływu chłodziwa z Ujęcia MZK. Rozpoczęto sekwencję wygaszania (Czas: 6s).", "error");
          setCoolingSecondsLeft(6);
          changed = true;
        }
      }

      if (coolingSecondsLeft !== null && coolingSecondsLeft > 0) {
        const nextTime = Math.max(0, coolingSecondsLeft - 1 * simSpeed);
        setCoolingSecondsLeft(nextTime);
        if (nextTime === 0) {
          nodeMap["OBJ_02"] = {
            ...elektrownia,
            health: 0,
            status: "DESTROYED",
            notes: "WYLĄCZONA AWARYJNIE: Turbina odłączona w celu ochrony przed stopieniem reaktora."
          };
          changed = true;
          addLog("OBJ_02 (Elektrownia): BLOK ENERGETYCZNY WYGASZONY. Całkowity blackout Stalowej Woli!", "error");
          setCoolingSecondsLeft(null);
        }
      }

      const maziarnia = nodeMap["OBJ_04"];
      const czk = nodeMap["OBJ_07"];
      if (maziarnia.status === "DESTROYED" && czk.status === "OPERATIONAL") {
        nodeMap["OBJ_07"] = {
          ...czk,
          health: 40,
          status: "DEGRADED",
          notes: "AWARIA ZASILANIA: Sztab kryzysowy zasilany z UPS i radiostacji VHF."
        };
        changed = true;
        addLog("OBJ_07 (Centrum Kryzysowe): Utracono główne zasilanie sieci przesyłowej GPZ Maziarnia! Uruchomiono radiotelefony VHF.", "error");
      }

      if (changed) {
        const updatedNodes = nodes.map((n) => nodeMap[n.id] || n);
        setNodes(() => updatedNodes);

        const Cesium = (window as any).Cesium;
        if (Cesium) {
          updatedNodes.forEach((node) => {
            const entity = nodeEntitiesRef.current[node.id];
            if (entity) {
              const colorStr = node.status === "OPERATIONAL" ? "#22c55e" : node.status === "DEGRADED" ? "#eab308" : "#ef4444";
              entity.point.color = Cesium.Color.fromCssColorString(colorStr);
            }
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nodes, simSpeed, coolingSecondsLeft, waterSecondsLeft, addLog, setNodes, setCoolingSecondsLeft, setWaterSecondsLeft, nodeEntitiesRef]);
}
