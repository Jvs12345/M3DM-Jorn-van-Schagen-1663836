import { SimpleClassifier } from './SimpleModel';
import { generateReturns } from '../logic/data';
import type { TrainingExample, QualityGrade } from './types';

export const bootstrapModel = (): SimpleClassifier => {
    const model = new SimpleClassifier();

    // Check if we have saved weights in localStorage (Mocking file system for browser)
    const saved = localStorage.getItem('returnflow_model_weights');
    if (saved) {
        console.log("Loading saved model...");
        model.load(saved);
        return model;
    }

    console.log("Bootstrapping new model from synthetic data...");

    // Generate synthetic training data
    // We use the existing data generator but assume "Ground Truth" rules
    // to create the initial "Pre-trained" state.
    const trainingData = generateReturns(12345, 100);
    const examples: TrainingExample[] = trainingData.map(item => {
        const v = item.visualSignals;
        let label: QualityGrade = 'C';

        // "Ground Truth" Logic for Training Labels
        // In a real scenario, these would be human labels.
        // Here we simulate human labeling based on the underlying truth.

        if (v.productDamageScore < 0.1 && v.packagingDamageScore < 0.2) label = 'A';
        else if (v.productDamageScore < 0.3) label = 'B';
        else if (v.productDamageScore < 0.6) label = 'C';
        else label = 'D';

        // Add some noise for realism (Human error)
        if (Math.random() > 0.95) {
            const grades: QualityGrade[] = ['A', 'B', 'C', 'D'];
            label = grades[Math.floor(Math.random() * 4)];
        }

        return {
            features: model.extractFeatures(item),
            label
        };
    });

    // Train the model
    // multiple epochs to converge the linear weights
    for (let i = 0; i < 50; i++) {
        model.train(examples);
    }

    // Save
    localStorage.setItem('returnflow_model_weights', model.serialize());

    console.log("Model bootstrapped and saved.");
    return model;
};
