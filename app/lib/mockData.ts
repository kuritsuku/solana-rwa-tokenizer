export interface Property {
  id: string;
  name: string;
  location: string;
  image: string;
  valuationUsd: number;
  totalShares: number;
  soldShares: number;
  pricePerShare: number;
  annualYieldPercent: number;
  edsHash: string;
  edsVerified: boolean;
  description: string;
  type: "residential" | "commercial" | "office";
  area: number; // m²
}

export const PROPERTIES: Property[] = [
  {
    id: "prop-kz-001",
    name: "ЖК Нурлы Жол",
    location: "Алматы, ул. Достык 12",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    valuationUsd: 450_000,
    totalShares: 1_000_000,
    soldShares: 620_000,
    pricePerShare: 0.45,
    annualYieldPercent: 7.5,
    edsHash: "a3f8c2d1e9b47056",
    edsVerified: true,
    description: "Современный жилой комплекс в центре Алматы. 3-комнатная квартира, 95 м², новостройка 2023 года. Стабильный арендный доход.",
    type: "residential",
    area: 95,
  },
  {
    id: "prop-kz-002",
    name: "БЦ Expo Tower, офис",
    location: "Астана, пр. Мангілік Ел 55",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    valuationUsd: 1_200_000,
    totalShares: 1_000_000,
    soldShares: 410_000,
    pricePerShare: 1.2,
    annualYieldPercent: 6.8,
    edsHash: "b7e1a4f2c8d93071",
    edsVerified: true,
    description: "Офисное помещение класса А в деловом центре Астаны. 320 м², долгосрочный арендатор, контракт до 2028 года.",
    type: "office",
    area: 320,
  },
  {
    id: "prop-kz-003",
    name: "Апартаменты Alatau",
    location: "Алматы, мкр Горный Гигант",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    valuationUsd: 280_000,
    totalShares: 1_000_000,
    soldShares: 280_000,
    pricePerShare: 0.28,
    annualYieldPercent: 8.1,
    edsHash: "c5d2b9e3f1a06482",
    edsVerified: true,
    description: "Апартаменты у подножия Заилийского Алатау, туристический объект. Высокий спрос на краткосрочную аренду, yield до 8.1%.",
    type: "residential",
    area: 62,
  },
];

export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
