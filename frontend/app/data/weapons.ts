import { WeaponSystem } from "../types";

export const WEAPONS: WeaponSystem[] = [
  {
    type: "PILICA",
    name: "PSR-A PILICA",
    range: 5000,
    color: "#ff4d4d",
    colorHex: "#ff4d4d",
    description: "Kinetyczny system VSHORAD wyposażony w działka 23mm i rakiety Grom/Piorun.",
    threatsCovered: ["DRONE", "SHAHED", "MISSILE"]
  },
  {
    type: "WRE",
    name: "WRE JAMMER",
    range: 2000,
    color: "#3b82f6",
    colorHex: "#3b82f6",
    description: "Mobilna stacja zakłócania elektronicznego pasma GPS/RF na drony cywilne.",
    threatsCovered: ["DRONE"]
  },
  {
    type: "RADAR",
    name: "RADAR MAŁOGABARYTOWY",
    range: 3500,
    color: "#22c55e",
    colorHex: "#22c55e",
    description: "Radar dopplerowski wczesnego wykrywania celów o małej sygnaturze LSS.",
    threatsCovered: ["DRONE", "SHAHED", "MISSILE"]
  }
];
