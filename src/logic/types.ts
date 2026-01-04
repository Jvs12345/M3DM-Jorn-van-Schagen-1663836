// Domain Models for ReturnFlow NL

export type Region = 'Randstad' | 'North' | 'East' | 'South';
export type HubId = 'AMS' | 'UTR' | 'EIN' | 'GRO';
export type Condition = 1 | 2 | 3 | 4 | 5; // 1 = Damage/Scrap, 5 = New/Sealed
export type DispositionAction = 'RESTOCK' | 'REFURBISH' | 'OUTLET' | 'RECYCLE' | 'DISPOSE' | 'DESTROY';

export interface Hub {
    id: HubId;
    name: string;
    location: Region;
    capacity: number;
    congestionLevel: 'Low' | 'Medium' | 'High';
}

export interface ReturnItem {
    id: string;
    // Core Kaggle Fields (Simulated)
    category: 'Electronics' | 'Clothing' | 'Home' | 'Sports';
    reason: 'Defective' | 'Wrong Item' | 'Changed Mind' | 'Late Arrival';
    price: number;

    // Logistics Extensions
    week: number;
    region: Region;
    hubId: HubId;
    conditionScore: Condition;
    packagingIntact: boolean;

    // Calculated/Estimated metrics
    estimatedRefurbCost: number;
    estimatedResaleValue: number;
    recycleValue: number;
    processingTime: number; // minutes

    // External Factors
    weatherSeverity: number; // 0-100
    trafficIndex: number; // 0-100
    pickupFailureRisk: number; // 0-1 probability

    // Sustainability
    emptyKmProxy: number; // Distance/Route Density index
    sustainabilityImpactScore: number; // 0-100 (Higher is worse impact)

    // Visual Inspection Module (Simulated)
    visualSignals: VisualSignals;
}

export interface VisualSignals {
    packagingDamageScore: number; // 0.0 - 1.0 (1.0 = Crushed)
    productDamageScore: number; // 0.0 - 1.0 (1.0 = Broken)
    packagingType: 'none' | 'torn' | 'crushed' | 'wet' | 'resealed';
    sealIntact: boolean;
    labelReadability: 'good' | 'poor';
    visionConfidence: number; // 0.0 - 1.0 (Low confidence = blurry/occluded)
}

export interface LogisticsMetrics {
    slaRiskScore: number; // 0-100
    recoveryPotential: number; // 0-1 (ROI)
    leanWasteScore: number; // 0-100
    priorityScore: number; // 0-100

    // Vision-Augmented Risks
    inspectionRiskFlag: boolean; // True if Vision Confidence Low + High Damage
    safetyRiskFlag: boolean; // True if Electrical + Damage + Broken Seal
    overprocessingRisk: boolean; // True if Refurb > Resale + Backlog
    effectiveCondition: number; // Fused score (Human + Vision)

    // ML Integration
    aiGrade?: 'A' | 'B' | 'C' | 'D';
    aiConfidence?: number;
}

export interface Decision {
    action: DispositionAction;
    rationaleBullets: string[];
    rejectedAction: string;
    rejectedReason: string;
    contextSnapshot: LogisticsMetrics;
}
