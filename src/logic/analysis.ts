import type { ReturnItem, LogisticsMetrics } from './types';

export const analyzeReturn = (item: ReturnItem): LogisticsMetrics => {
    // 1. SLA Risk Calculation (Turnaround Time Risk)
    // Factors: Weather, Traffic, Hub Congestion, Complexity (Electronics)
    // Base Risk: 0.1
    let slaRisk = 10;

    // Weather Impact
    if (item.weatherSeverity > 80) slaRisk += 25;
    else if (item.weatherSeverity > 50) slaRisk += 10;

    // Traffic Impact
    if (item.trafficIndex > 75) slaRisk += 15;

    // Hub Impact (Based on ID lookup or implicit knowledge - using simplified heuristic here)
    // Assuming AMS and UTR have higher congestion risks implicitly if not strictly modeled
    if (item.hubId === 'AMS' || item.hubId === 'UTR') slaRisk += 10;

    // Category Impact
    if (item.category === 'Electronics') slaRisk += 20; // Complex testing

    slaRisk = Math.min(100, slaRisk);

    // 2. Recovery Potential (ROI)
    // Value / Cost equation
    // Potential = (Resale Value - Refurb Cost - Logistics Cost) / Original Price
    // Logistics cost proxy ~ 5 EUR + 0.5 * EmptyKM
    const logisticsCost = 5 + (item.emptyKmProxy * 0.2);
    const netValue = item.estimatedResaleValue - item.estimatedRefurbCost - logisticsCost;
    const recoveryPotential = Math.max(0, netValue / item.price);

    // 3. Lean Waste Score (Muda)
    // Composite of:
    // - Waiting: slaRisk > 50
    // - Transport: emptyKmProxy
    // - Defects: conditionScore < 3
    let wasteScore = 0;
    wasteScore += (item.emptyKmProxy / 50) * 30; // Max 30 points for transport
    wasteScore += (item.conditionScore < 3 ? 40 : 10); // Defects weight
    wasteScore += (slaRisk > 60 ? 30 : 0); // Waiting risk
    wasteScore = Math.min(100, Math.floor(wasteScore));

    // 4. Priority Score
    // Urgent if: High Value OR High SLA Risk OR High Sustainability Impact (negative)
    // We want to process High Value items fast to resell. 
    // We want to solve High SLA risk items to avoid penalties.
    const valueFactor = (item.price / 500) * 50; // Scaled to ~50
    const riskFactor = slaRisk * 0.5;
    const priorityScore = Math.min(100, Math.floor(valueFactor + riskFactor));

    // 5. Vision Fusion & Risk Flags
    const v = item.visualSignals;

    // Effective Condition (Fusion of reported condition + vision damage)
    // Vision is 0-1 (Damage), Condition is 1-5 (Quality).
    // Normalize condition to 0-1 (Quality) -> 1 - Norm = Damage
    const reportedDamage = 1 - (item.conditionScore / 5);
    // Weighted fusion based on confidence
    const fusedDamage = (reportedDamage * 0.4) + (v.productDamageScore * v.visionConfidence * 0.6);
    const effectiveCondition = parseFloat((1 - fusedDamage).toFixed(2)); // Back to 0-1 Quality score

    const inspectionRiskFlag = v.visionConfidence < 0.4 || (v.visionConfidence < 0.6 && v.productDamageScore > 0.7);

    // Safety: Electronics + Seal Broken + Any visible damage
    const safetyRiskFlag = item.category === 'Electronics' && !v.sealIntact && (v.productDamageScore > 0.1 || reportedDamage > 0.1);

    // Overprocessing: Refurb Cost > Resale OR (Backlog High ie SLA Risk > 50 AND Low Value)
    const overprocessingRisk = (item.estimatedRefurbCost > item.estimatedResaleValue) || (slaRisk > 60 && item.price < 50);

    return {
        slaRiskScore: slaRisk,
        recoveryPotential: parseFloat(recoveryPotential.toFixed(2)),
        leanWasteScore: wasteScore,
        priorityScore,
        inspectionRiskFlag,
        safetyRiskFlag,
        overprocessingRisk,
        effectiveCondition
    };
};
