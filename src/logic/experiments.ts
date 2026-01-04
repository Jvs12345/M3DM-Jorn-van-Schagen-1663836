import { evaluateStrategy } from './evaluation';
import { RuleBasedStrategy } from './impl_strategies/RuleBased';
import { WeightedScoringStrategy } from './impl_strategies/Weighted';
import { FeedbackStrategy } from './impl_strategies/Feedback';
import type { ExperimentResult } from './types';

export const runAllExperiments = (): ExperimentResult[] => {
    // 1. Instantiate Strategies
    const strategies = [
        new RuleBasedStrategy(),
        new WeightedScoringStrategy(),
        new FeedbackStrategy()
    ];

    // 2. Run Evaluation for each
    const results = strategies.map(strategy => {
        // Use consistent seed for fair comparison
        return evaluateStrategy(strategy, 777);
    });

    // 3. Optional: Run a variant experiment
    // e.g. "Risk Averse Weighted" -> change weights if we could config
    // For now, standard 3 comparison

    return results.sort((a, b) => b.avgMasteryGain - a.avgMasteryGain);
};
