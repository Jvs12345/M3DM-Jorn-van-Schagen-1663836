import type { ReturnItem, Hub, Region, Condition } from './types';

export class SeededRNG {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    var t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number {
    return min + (this.next() * (max - min));
  }
  choice<T>(array: T[]): T {
    return array[Math.floor(this.range(0, array.length))];
  }
}

export const HUBS: Hub[] = [
  { id: 'AMS', name: 'Amsterdam Hub', location: 'Randstad', capacity: 1000, congestionLevel: 'High' },
  { id: 'UTR', name: 'Utrecht Central', location: 'Randstad', capacity: 800, congestionLevel: 'Medium' },
  { id: 'EIN', name: 'Eindhoven Tech', location: 'South', capacity: 600, congestionLevel: 'Low' },
  { id: 'GRO', name: 'Groningen North', location: 'North', capacity: 400, congestionLevel: 'Low' }
];

export const generateReturns = (seed: number = 777, count: number = 200): ReturnItem[] => {
  const rng = new SeededRNG(seed);
  const items: ReturnItem[] = [];

  const categories = ['Electronics', 'Clothing', 'Home', 'Sports'] as const;
  const reasons = ['Defective', 'Wrong Item', 'Changed Mind', 'Late Arrival'] as const;

  for (let i = 0; i < count; i++) {
    // Core Attributes
    const category = rng.choice([...categories]);
    const reason = rng.choice([...reasons]);
    const hub = rng.choice(HUBS);

    // Correlations: Price & Condition
    let basePrice = 0;
    if (category === 'Electronics') basePrice = rng.range(50, 800);
    else if (category === 'Clothing') basePrice = rng.range(20, 150);
    else if (category === 'Home') basePrice = rng.range(30, 300);
    else basePrice = rng.range(20, 200);

    // Condition influenced by Reason
    let condition: Condition = 5;
    if (reason === 'Defective') condition = Math.floor(rng.range(1, 3)) as Condition;
    else if (reason === 'Wrong Item') condition = 5; // Opened but unused
    else if (reason === 'Changed Mind') condition = Math.floor(rng.range(3, 5)) as Condition;
    else condition = 5; // Late arrival usually new

    // Logistics Factors
    const weather = rng.range(0, 100);
    const traffic = rng.range(0, 100);

    // Calculated Metrics
    const conditionFactor = condition / 5; // 0.2 to 1.0
    const refurbCostBase = category === 'Electronics' ? 40 : 10;
    const estimatedRefurbCost = (1 - conditionFactor) * basePrice * 0.4 + refurbCostBase;
    const estimatedResaleValue = basePrice * conditionFactor * (category === 'Electronics' ? 0.7 : 0.5);

    // Delay Risks
    const pickupRisk = (weather > 80 || traffic > 80) ? rng.range(0.6, 0.9) : rng.range(0.0, 0.2);
    const processingTime = 15 + (hub.congestionLevel === 'High' ? 20 : 0) + (category === 'Electronics' ? 15 : 0);

    // Sustainability
    const emptyKm = (hub.location === 'North' || hub.location === 'East') ? rng.range(20, 50) : rng.range(5, 15);
    const packagingIntact = rng.next() > 0.3;

    // Visual Inspection Simulation (Noisy)
    const truthDamage = 1.0 - (condition / 5.0);
    const noise = rng.range(-0.1, 0.2);
    const productDamageScore = Math.max(0, Math.min(1, truthDamage + noise));
    const visionConfidence = Math.max(0.1, Math.min(1, (category === 'Electronics' ? 0.6 : 0.9) + rng.range(-0.2, 0.1)));
    const packagingDamageScore = packagingIntact ? rng.range(0, 0.2) : rng.range(0.4, 0.9);
    const packagingType = packagingDamageScore > 0.6 ? (rng.next() > 0.5 ? 'crushed' : 'torn') : 'none';

    items.push({
      id: `ret-${1000 + i}`,
      category,
      reason,
      price: parseFloat(basePrice.toFixed(2)),
      week: Math.floor(rng.range(1, 12)),
      region: hub.location,
      hubId: hub.id,
      conditionScore: condition,
      packagingIntact,
      estimatedRefurbCost: parseFloat(estimatedRefurbCost.toFixed(2)),
      estimatedResaleValue: parseFloat(estimatedResaleValue.toFixed(2)),
      recycleValue: basePrice * 0.05,
      processingTime: Math.floor(processingTime),
      weatherSeverity: Math.floor(weather),
      trafficIndex: Math.floor(traffic),
      pickupFailureRisk: parseFloat(pickupRisk.toFixed(2)),
      emptyKmProxy: Math.floor(emptyKm),
      sustainabilityImpactScore: Math.floor(emptyKm + (packagingIntact ? 0 : 10) + (category === 'Electronics' ? 20 : 5)),
      visualSignals: {
        productDamageScore: parseFloat(productDamageScore.toFixed(2)),
        packagingDamageScore: parseFloat(packagingDamageScore.toFixed(2)),
        packagingType: packagingType as any,
        sealIntact: reason !== 'Defective' && rng.next() > 0.4,
        labelReadability: rng.next() > 0.1 ? 'good' : 'poor',
        visionConfidence: parseFloat(visionConfidence.toFixed(2))
      }
    });
  }

  return items;
};
