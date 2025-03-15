let speed = 0;
let distance = 0;
let isRunning = false;
let interval;

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    const accelerateButton = document.getElementById('accelerate');
    const decelerateButton = document.getElementById('decelerate');
    const emergencyButton = document.getElementById('emergency');
    const speedDisplay = document.getElementById('speed');
    const distanceDisplay = document.getElementById('distance');

    // Constants
    const MAX_SPEED = 120; // km/h
    const ACCELERATION_RATE = 5; // km/h per second
    const DECELERATION_RATE = 3; // km/h per second
    const UPDATE_INTERVAL = 100; // milliseconds

    // Add event listeners to buttons
    startButton.addEventListener('click', startTrain);
    stopButton.addEventListener('click', stopTrain);
    accelerateButton.addEventListener('click', accelerate);
    decelerateButton.addEventListener('click', decelerate);
    emergencyButton.addEventListener('click', emergencyBrake);

    // Start the train
    function startTrain() {
        if (!isRunning) {
            isRunning = true;
            interval = setInterval(updateSimulation, UPDATE_INTERVAL);
            console.log('Train started');
        }
    }

    // Stop the train
    function stopTrain() {
        if (isRunning) {
            isRunning = false;
            clearInterval(interval);
            console.log('Train stopped');
        }
    }

    // Accelerate the train
    function accelerate() {
        if (speed < MAX_SPEED) {
            speed += ACCELERATION_RATE;
            if (speed > MAX_SPEED) {
                speed = MAX_SPEED;
            }
            updateDisplays();
            console.log('Accelerating, speed: ' + speed);
        }
    }

    // Decelerate the train
    function decelerate() {
        if (speed > 0) {
            speed -= DECELERATION_RATE;
            if (speed < 0) {
                speed = 0;
            }
            updateDisplays();
            console.log('Decelerating, speed: ' + speed);
        }
    }

    // Emergency brake
    function emergencyBrake() {
        speed = 0;
        updateDisplays();
        console.log('EMERGENCY BRAKE APPLIED!');
    }

    // Update the simulation
    function updateSimulation() {
        if (isRunning && speed > 0) {
            // Update distance based on speed
            distance += (speed / 3600) * (UPDATE_INTERVAL / 1000);
            updateDisplays();
        }
    }

    // Update speed and distance displays
    function updateDisplays() {
        speedDisplay.textContent = speed.toFixed(2);
        distanceDisplay.textContent = distance.toFixed(2);
    }

    // Initialize displays
    updateDisplays();
}); 