import { useEffect } from "react";
import { CriticalNode, Threat } from "../types";

export function useDefcon(
  threats: Threat[],
  nodes: CriticalNode[],
  deployedSystemsLength: number,
  defcon: number,
  setDefcon: (n: number) => void,
  addLog: (text: string, type: "info" | "success" | "warning" | "error" | "combat") => void
) {
  useEffect(() => {
    let targetDefcon = 5;
    const activeThreatCount = threats.filter((t) => t.status === "FLYING").length;
    const destroyedCount = nodes.filter((n) => n.status === "DESTROYED").length;

    if (destroyedCount >= 3) {
      targetDefcon = 1;
    } else if (destroyedCount >= 1 || activeThreatCount >= 3) {
      targetDefcon = 2;
    } else if (activeThreatCount >= 1) {
      targetDefcon = 3;
    } else if (deployedSystemsLength > 0) {
      targetDefcon = 4;
    }

    if (targetDefcon !== defcon) {
      setDefcon(targetDefcon);
      addLog(`ZMIANA POZIOMU ZAGROŻENIA: STOPIEŃ ${targetDefcon}`, targetDefcon <= 2 ? "error" : targetDefcon === 3 ? "warning" : "info");
    }
  }, [threats, nodes, deployedSystemsLength, defcon, setDefcon, addLog]);
}
