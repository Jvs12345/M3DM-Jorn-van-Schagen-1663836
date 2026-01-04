// Disposition Strategies (Decision Engine)
import type { ReturnItem, LogisticsMetrics, Decision, DispositionAction } from './types';

export interface DispositionStrategy {
    name: string;
    description: string;
    evaluate(item: ReturnItem, metrics: LogisticsMetrics): Decision;
}

// 1. Rule-Based Strategy (Strict Thresholds)
export class RuleBasedDisposition implements DispositionStrategy {
    name = 'Rule-Based (Standard)';
    description = 'Fixed thresholds for condition, price, and visual safety.';

    evaluate(item: ReturnItem, metrics: LogisticsMetrics): Decision {
        let action: DispositionAction;
        let reasons: string[] = [];
        let rejected = 'REFURBISH';
        let rejectReason = 'Does not meet criteria.';

        // ** AI PREDICTION INTEGRATION **
        const useAI = metrics.aiConfidence && metrics.aiConfidence > 0.7;
        let effectiveGrade = item.conditionScore;

        if (useAI && metrics.aiGrade) {
            // Map A/B/C/D to 1-5 roughly for compatibility
            const gradeMap: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 1 };
            effectiveGrade = gradeMap[metrics.aiGrade] || item.conditionScore;
            reasons.push(`AI Prediction Used: Grade ${metrics.aiGrade} (${(metrics.aiConfidence! * 100).toFixed(0)}%)`);
        } else if (metrics.aiConfidence && metrics.aiConfidence <= 0.7) {
            reasons.push(`⚠️ Low AI Confidence (${(metrics.aiConfidence * 100).toFixed(0)}%): Manual Inspection Required.`);
        }

        // 1. Safety Hard Stop
        if (metrics.safetyRiskFlag) {
            return {
                action: 'DESTROY',
                rationaleBullets: [
                    'SAFETY ALERT: Electronics with broken seal/damage.',
                    'Immediate destruction required to prevent fire/data risk.'
                ],
                rejectedAction: 'RECYCLE',
                rejectedReason: 'Safety hazard prevents standard recycling.',
                contextSnapshot: metrics
            };
        }

        // 2. Vision Check
        if (metrics.inspectionRiskFlag) {
            // Low confidence + high damage signal -> Conservative Recycle
            // In a real system, this might go to "Manual Review", here we conservative Recycle if cheap
            if (item.price < 50) {
                return {
                    action: 'RECYCLE',
                    rationaleBullets: [
                        'Vision Confidence Low (< 40%) & Damage Signal Detected.',
                        'Item value (< €50) does not justify manual inspection.'
                    ],
                    rejectedAction: 'RESTOCK',
                    rejectedReason: 'Risk of restocking damaged item (Fraud/brand risk).',
                    contextSnapshot: metrics
                };
            }
        }

        if (effectiveGrade === 1 || metrics.effectiveCondition < 0.2) {
            action = 'RECYCLE';
            reasons.push('Condition/Vision Score indicates Scrap.');
            reasons.push(`Effective Condition: ${(metrics.effectiveCondition * 100).toFixed(0)}%`);
        } else if (item.price < 20) {
            action = 'DISPOSE';
            reasons.push('Item value < 20 EUR (Uneconomical to process).');
            rejected = 'RESTOCK';
            rejectReason = 'Processing cost exceeds value.';
        } else if (effectiveGrade >= 4 && metrics.effectiveCondition > 0.8) {
            action = 'RESTOCK';
            reasons.push(`High Condition Score (Human: ${item.conditionScore}, Vision: Confirmed).`);
            reasons.push('Packaging likely intact or easily fixable.');
        } else {
            // Mid-range
            if (metrics.recoveryPotential > 0.3 && !metrics.overprocessingRisk) {
                action = 'REFURBISH';
                reasons.push(`Strong ROI Potential (${(metrics.recoveryPotential * 100).toFixed(0)}%).`);
            } else {
                action = 'OUTLET';
                reasons.push('Moderate condition but low refurb ROI/Backlog risk.');
            }
        }

        return {
            action,
            rationaleBullets: reasons,
            rejectedAction: rejected,
            rejectedReason: rejectReason,
            contextSnapshot: metrics
        };
    }
}

// 2. Weighted Scoring Strategy (Configurable Priorities)
export class WeightedScoringDisposition implements DispositionStrategy {
    name = 'Weighted Scoring (Balanced)';
    description = 'Balances Financial ROI vs Sustainability vs Speed vs Vision Confidence.';

    evaluate(item: ReturnItem, metrics: LogisticsMetrics): Decision {
        // Safety First
        if (metrics.safetyRiskFlag) {
            return {
                action: 'DESTROY',
                rationaleBullets: ['SAFETY CRITICAL: Vision detected hazard.'],
                rejectedAction: 'ALL',
                rejectedReason: 'Non-negotiable safety standards.',
                contextSnapshot: metrics
            };
        }

        // Weights
        const wROI = 0.4;
        const wGreen = 0.3;
        const wSpeed = 0.2;
        const wVision = 0.1; // Confidence bonus

        // Normalize Scores (0-1)
        const sROI = metrics.recoveryPotential;
        const sGreen = 1 - (metrics.leanWasteScore / 100);
        const sSpeed = 1 - (metrics.slaRiskScore / 100);
        // Use AI Confidence if available, else raw vision confidence
        const sVision = metrics.aiConfidence || item.visualSignals.visionConfidence;

        const totalScore = (sROI * wROI) + (sGreen * wGreen) + (sSpeed * wSpeed) + (sVision * wVision);

        let action: DispositionAction;
        let rationale: string[] = [`Composite Score: ${totalScore.toFixed(2)}`];

        if (metrics.aiGrade) {
            rationale.push(`AI Prediction: Grade ${metrics.aiGrade} (Used in scoring)`);
        }

        if (sGreen < 0.2 || metrics.overprocessingRisk) {
            action = 'RECYCLE';
            rationale.push('Lean Decision: Avoided Overprocessing/High Waste.');
        } else if (totalScore > 0.75) {
            action = 'RESTOCK';
            rationale.push('High composite score (Value + Sustainability + Vision).');
        } else if (totalScore > 0.45) {
            action = 'REFURBISH';
            rationale.push('Moderate value recovery possible.');
        } else {
            action = 'OUTLET';
            rationale.push('Score too low for primary channels.');
        }

        return {
            action,
            rationaleBullets: rationale,
            rejectedAction: 'DISPOSE',
            rejectedReason: 'Weighted score favors recovery over disposal.',
            contextSnapshot: metrics
        };
    }
}

// 3. Feedback/RL-Lite Strategy (Optimizing for Profit & Brand)
export class FeedbackDisposition implements DispositionStrategy {
    name = 'Feedback-Adaptive (RL Lite)';
    description = 'Learns form simulated "realized" outcomes & Vision Confidence.';

    evaluate(item: ReturnItem, metrics: LogisticsMetrics): Decision {
        let action: DispositionAction = 'OUTLET';
        let rationale: string[] = [];

        // 1. Reward Safety Prevention
        if (metrics.safetyRiskFlag) {
            return {
                action: 'DESTROY',
                rationaleBullets: [
                    'AI Reward (+50): Major safety incident prevented.',
                    'Vision detected disrupted seal on electronics.'
                ],
                rejectedAction: 'REFURBISH',
                rejectedReason: 'High probability of battery fire during refurb.',
                contextSnapshot: metrics
            };
        }

        // 2. Lean Rewards (Avoid Waste)
        if (metrics.overprocessingRisk) {
            return {
                action: 'RECYCLE', // Or Destroy if cheaper
                rationaleBullets: [
                    'AI Reward (+20): Avoided negative margin refurbishment.',
                    'Backlog High + Low Item Value = Lean Waste.'
                ],
                rejectedAction: 'REFURBISH',
                rejectedReason: 'Predicted processing cost > Resale value.',
                contextSnapshot: metrics
            };
        }

        // AI Model Influence
        const aiConf = metrics.aiConfidence || 0;
        if (aiConf > 0.8 && metrics.aiGrade) {
            rationale.push(`🤖 High Confidence Model Prediction: Grade ${metrics.aiGrade}`);
            if (metrics.aiGrade === 'A') {
                action = 'RESTOCK';
                rationale.push('Model overrides heuristics: Item confirmed new/A-grade.');
                return { action, rationaleBullets: rationale, rejectedAction: 'OUTLET', rejectedReason: 'Model identified premium value.', contextSnapshot: metrics };
            } else if (metrics.aiGrade === 'D') {
                action = 'RECYCLE';
                rationale.push('Model overrides heuristics: Item confirmed scrap.');
                return { action, rationaleBullets: rationale, rejectedAction: 'REFURBISH', rejectedReason: 'Model identified fatal damage.', contextSnapshot: metrics };
            }
        } else if (aiConf < 0.5) {
            rationale.push('⚠️ Model Uncertain: Defaulting to conservative heuristic.');
        }

        // Learned Heuristic 1: Electronics need cautious refurb
        if (item.category === 'Electronics' && metrics.effectiveCondition < 0.6) {
            action = 'RECYCLE';
            rationale.push('AI Insight: Vision confirms damage severity > 40%.');
        }
        // Learned Heuristic 2: Seasonal Clothing dump
        else if (item.category === 'Clothing' && item.week > 10) {
            action = 'OUTLET';
            rationale.push('AI Insight: Season ending, restock will result in dead stock.');
        }
        // Learned Heuristic 3: High Empty KM penalization
        else if (item.emptyKmProxy > 40 && item.price < 50) {
            action = 'DISPOSE';
            rationale.push('AI Insight: Logistics carbon cost exceeds item recovery value.');
        }
        else {
            // Fallback to optimized ROI
            if (metrics.recoveryPotential > 0.5 && item.visualSignals.visionConfidence > 0.6) action = 'RESTOCK';
            else if (metrics.recoveryPotential > 0.2) action = 'REFURBISH';
            else action = 'RECYCLE';
            rationale.push('AI Optimization: Best projected path for Net Profit.');
            if (item.visualSignals.visionConfidence < 0.5) rationale.push('(Warning: Low vision confidence, human verify recommended)');
        }

        return {
            action,
            rationaleBullets: rationale,
            rejectedAction: 'RESTOCK',
            rejectedReason: 'AI predicts negative margin for restock.',
            contextSnapshot: metrics
        };
    }
}
