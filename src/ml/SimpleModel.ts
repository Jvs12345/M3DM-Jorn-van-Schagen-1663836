import type { FeatureVector, ModelPrediction, ModelWeights, TrainingExample, QualityGrade } from './types';
import type { ReturnItem } from '../logic/types';

export class SimpleClassifier {
    private weights: ModelWeights;
    private learningRate = 0.05;
    private classes: QualityGrade[] = ['A', 'B', 'C', 'D'];

    constructor() {
        // Initialize with rough heuristic weights (Pre-training/Bootstrap will refine this)
        // 4 Features: [ProductDamage, PkgDamage, VisionConfidence, IsElectronics]
        this.weights = {
            'A': [-2.0, -1.0, 0.5, 0.0],  // Low damage, high confidence
            'B': [-0.5, -0.2, 0.2, 0.0],  // Mild damage
            'C': [1.0, 0.5, 0.0, 0.0],    // Moderate damage
            'D': [3.0, 2.0, 0.0, 0.2]     // High damage
        };
    }

    // Convert Item to Feature Vector (Normalized)
    extractFeatures(item: ReturnItem): number[] {
        const v = item.visualSignals;
        return [
            v.productDamageScore,       // 0-1
            v.packagingDamageScore,     // 0-1
            v.visionConfidence,         // 0-1
            item.category === 'Electronics' ? 1.0 : 0.0
        ];
    }

    // Predict Grade
    predict(item: ReturnItem): ModelPrediction {
        const features = this.extractFeatures(item);
        const scores: Record<string, number> = {};

        // Dot product Wx + b (Bias omitted for simplicity, can act as threshold)
        for (const cls of this.classes) {
            scores[cls] = features.reduce((sum, f, i) => sum + (f * (this.weights[cls][i] || 0)), 0);
        }

        // Softmax
        const expScores: Record<string, number> = {};
        let sumExp = 0;
        for (const cls in scores) {
            expScores[cls] = Math.exp(scores[cls]);
            sumExp += expScores[cls];
        }

        const probs = {} as Record<QualityGrade, number>;
        let maxProb = -1;
        let bestClass: QualityGrade = 'C';

        for (const cls of this.classes) {
            probs[cls as QualityGrade] = expScores[cls] / sumExp;
            if (probs[cls as QualityGrade] > maxProb) {
                maxProb = probs[cls as QualityGrade];
                bestClass = cls as QualityGrade;
            }
        }

        return {
            grade: bestClass,
            confidence: maxProb,
            probabilities: probs
        };
    }

    // Online Training (SGD Update)
    train(examples: TrainingExample[]) {
        examples.forEach(ex => {
            const { features, label } = ex;

            // Current Prediction
            const scores: Record<string, number> = {};
            for (const cls of this.classes) {
                scores[cls] = features.reduce((sum, f, i) => sum + (f * (this.weights[cls][i] || 0)), 0);
            }
            // Softmax
            let sumExp = 0;
            const probs: Record<string, number> = {};
            for (const cls of this.classes) {
                probs[cls] = Math.exp(scores[cls]);
                sumExp += probs[cls];
            }
            for (const cls of this.classes) probs[cls] /= sumExp;

            // Gradient Update (Cross Entropy Loss derivation for Softmax)
            // W_new = W_old - lr * (prob - target) * feature
            for (const cls of this.classes) {
                const target = (cls === label) ? 1.0 : 0.0;
                const error = probs[cls] - target;

                for (let i = 0; i < features.length; i++) {
                    this.weights[cls][i] -= this.learningRate * error * features[i];
                }
            }
        });
    }

    serialize(): string {
        return JSON.stringify(this.weights);
    }

    load(json: string) {
        try {
            this.weights = JSON.parse(json);
        } catch (e) {
            console.error("Failed to load weights", e);
        }
    }
}
