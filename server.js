const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const csvParser = require('csv-parser');

// Initialize Express
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve static files (Homepage.html, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Load CSV dataset into memory (optional for now, can be used later for advanced prediction)
let dataset = [];
fs.createReadStream('diabetes_binary_5050split_health_indicators_BRFSS2015.csv') // Ensure the file is in the same directory
    .pipe(csvParser())
    .on('data', (row) => {
        dataset.push(row);
    })
    .on('end', () => {
        console.log('CSV file successfully loaded. Total rows:', dataset.length);
    });

// Define the states and transition matrix for the Markov model
const states = ['Normal', 'Mild', 'Moderate', 'Severe'];
const transitionMatrix = [
    [0.8, 0.15, 0.05, 0],    // From Normal to (Normal, Mild, Moderate, Severe)
    [0.1, 0.7, 0.2, 0],      // From Mild to (Normal, Mild, Moderate, Severe)
    [0.05, 0.1, 0.7, 0.15],  // From Moderate to (Normal, Mild, Moderate, Severe)
    [0, 0.05, 0.2, 0.75]     // From Severe to (Normal, Mild, Moderate, Severe)
];

// Function to predict the next state based on user input
function predictNextState(currentStateIndex) {
    const randomProb = Math.random();  // Generate a random number between 0 and 1
    let cumulativeProb = 0;

    // Use the transition matrix to determine the next state
    for (let i = 0; i < states.length; i++) {
        cumulativeProb += transitionMatrix[currentStateIndex][i];
        if (randomProb < cumulativeProb) {
            return i;  // Return the index of the next state
        }
    }

    return currentStateIndex;  // Default to current state if no transition happens
}

// Function to check kidney donation eligibility
function checkKidneyDonationEligibility(creatinineLevel) {
    if (creatinineLevel >= 0.6 && creatinineLevel <= 1.2) {
        return { eligibility: 'Eligible for Donation', creatinineLevel };
    } else {
        return { eligibility: 'Not Eligible for Donation', creatinineLevel };
    }
}

// API to fetch the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Homepage.html'));
});

// API to predict creatinine levels using Markov model
app.post('/api/predict', (req, res) => {
    const { saltIntake, waterIntake, age, bmi, diabetesStatus, exercise, bloodSugar, HbA1c } = req.body;

    // Starting state (Normal)
    let currentStateIndex = 0;  // 0 corresponds to 'Normal'

    // Adjust state based on user inputs
    if (saltIntake > 5) {
        currentStateIndex = 1;  // Mild state
    } else if (age > 60 || bmi > 30) {
        currentStateIndex = 2;  // Moderate state
    } else if (diabetesStatus !== 'none') {
        currentStateIndex = 3;  // Severe state
    }

    // Use the Markov model to predict the next state based on the current state
    const nextStateIndex = predictNextState(currentStateIndex);

    // Get predicted creatinine level based on the state
    const predictedState = states[nextStateIndex];
    const creatinineLevel = getCreatinineLevel(predictedState);

    // Check kidney donation eligibility
    const donationEligibility = checkKidneyDonationEligibility(creatinineLevel);

    // Return predicted state, creatinine level, and donation eligibility
    res.json({
        predictedState,
        creatinineLevel,
        donationEligibility
    });
});

// Helper function to map states to creatinine levels
function getCreatinineLevel(state) {
    switch (state) {
        case 'Normal':
            return 1.0;
        case 'Mild':
            return 1.5;
        case 'Moderate':
            return 2.5;
        case 'Severe':
            return 4.0;
        default:
            return 1.0;
    }
}

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});