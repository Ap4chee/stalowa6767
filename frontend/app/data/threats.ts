import { ThreatType } from "../types";

export const THREAT_TYPES: Record<string, ThreatType> = {
  DRONE: {
    type: "DRONE",
    name: "Dron komercyjny / rozpoznawczy",
    speed: 0.0003,
    alt: 120,
    description: "Niski pułap, wolna prędkość. Podatny na WRE oraz Pilicę.",
    immuneToWRE: false
  },
  SHAHED: {
    type: "SHAHED",
    name: "Amunicja krążąca (Shahed-136)",
    speed: 0.0005,
    alt: 250,
    description: "Ukrycie terenowe w dolinie Sanu. Odporny na podstawowe zakłócacze WRE.",
    immuneToWRE: true
  },
  MISSILE: {
    type: "MISSILE",
    name: "Rakieta manewrująca",
    speed: 0.0014,
    alt: 600,
    description: "Wysoka prędkość i pułap. Wyłącznie Pilica kinetycznie może ją zestrzelić.",
    immuneToWRE: true
  }
};
