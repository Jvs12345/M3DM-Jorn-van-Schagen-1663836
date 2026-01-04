# Project Tasks & Progress Log

## Phase 1: Setup & Data Core
- [x] Initialize project with Vite + React + TS
- [x] Clean up default App.css and boilerplate
- [x] **Data Architecture**: Create `generateReturns()` to act as a Digital Twin generator.
    - *Goal*: Simulate "Dirty Data" (broken seals, weather delays) to test robustness.
    - *Features*: Added `visualSignals` vector (damage scores) to every item.
- [x] Define TypeScript interfaces for robust typing.

## Phase 2: Core Logic
- [x] Implement Basic Rule-Based strategy
- [x] Add Weighted Scoring strategy (ROI vs Green vs Speed)
- [x] Create Analysis helpers (Recovery Potential calc, SLA Risk calc)
- [x] Build the `DispositionCard` component to show decisions

## Phase 3: Dashboard UI
- [x] Create main layout with Sidebar and Content area
- [x] Build Analytics Dashboard (Top KPIs)
- [x] Add "Lean Waste" breakdown
- [x] Create Network Map component (Netherlands SVG visualization)

## Phase 4: Machine Learning Implementation
- [x] **Model Design**: Built a custom **Linear Classifier (SGD)** from scratch. 
    - *Reason*: Demonstrate understanding of `w*x + b` logic without heavy libraries.
    - *Features*: Uses `productDamage`, `packagingDamage`, and `visionConfidence` as primary signals.
- [x] **Data Strategy**:
    - Implemented a **Bootstrapping** process: Generates 100 synthetic "ground truth" items on startup to initialize weights.
    - **Online Learning**: The model updates weights in real-time based on active user feedback (Feature Vector -> Prediction -> Error Calculation -> Weight Update).
- [x] Build "Fine Tuning Panel" to visualize the feature inputs and allow human correction.

## Phase 5: Polish & UX
- [x] Switch to "Glassmorphism" / Cyberpunk dark theme
- [x] Add detailed tooltips/modals for SLA Risk and ROI calculations
- [x] Make dashboard graphs clickable (Drill-downs)
- [x] Fix white screen bug in DispositionCard (modal issue)
- [x] Final code cleanup and documentation
