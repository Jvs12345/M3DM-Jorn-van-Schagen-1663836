# ReturnFlow NL (M3DM Individual Project)

This is a prototype Dashboard for managing Reverse Logistics in the Netherlands. It uses a "Digital Twin" approach to simulate incoming returns and provides a decision support system for operators.

## Tech Stack
*   React + TypeScript
*   Vite
*   Local Storage for State Persistence

## How to Run
1.  `npm install`
2.  `npm run dev`
3.  Open http://localhost:5173

## Features
*   **Overview Dashboard**: Real-time metrics on SLA Risk, Recovery Value, and Lean Waste.
*   **Disposition Workbench**: Interface for processing individual return items.
*   **Simulated ML**: A local classifier that learns from user feedback (Demo Mode).

## Project Structure
*   `src/components`: UI Elements.
*   `src/logic`: Business rules and data generation.
*   `src/ml`: The custom classifier implementation.
