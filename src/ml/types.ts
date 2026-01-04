export type QualityGrade = 'A' | 'B' | 'C' | 'D'; // A=New/5, B=Good/4, C=Functional/2-3, D=Scrap/1

export interface ModelPrediction {
    grade: QualityGrade;
    confidence: number; // 0.0 - 1.0 (Probability of top class)
    probabilities: Record<QualityGrade, number>;
}

export interface TrainingExample {
    features: number[]; // [productDamage, packagingDamage, visionConfidence, categoryIndex]
    label: QualityGrade;
}

export interface FeatureVector {
    productDamage: number; // 0-1
    packagingDamage: number; // 0-1
    visionConfidence: number; // 0-1
    isElectronics: number; // 0 or 1
}

export interface ModelWeights {
    // One set of weights per class (simple linear classifier per class, softmax later)
    [grade: string]: number[];
}
