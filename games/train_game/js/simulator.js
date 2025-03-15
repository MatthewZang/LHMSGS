let selectedSeat = null;

function change_seats(passengerId) {
    const passengerName = passengerId.value;
    if (passengerName.trim() === '') {
        alert('Please enter a passenger name');
        return;
    }

    // Create seat selection if it doesn't exist
    if (!document.getElementById('seat-map')) {
        createSeatMap();
    }

    // Show confirmation alert
    const alertElement = document.querySelector('.alert');
    alertElement.style.display = 'block';
    alertElement.querySelector('p').textContent = 
        `Passenger ${passengerName} selected seat ${selectedSeat || 'none'}`;

    // Hide alert after 3 seconds
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 3000);
}

function createSeatMap() {
    const seatMap = document.createElement('div');
    seatMap.id = 'seat-map';
    seatMap.innerHTML = `
        <h3>Select Your Seat</h3>
        <div class="airplane-seats">
            ${generateSeats()}
        </div>
    `;
    document.querySelector('.simulator-container').insertBefore(
        seatMap, 
        document.querySelector('.passenger-input')
    );
}

function generateSeats() {
    let seats = '';
    for (let row = 1; row <= 6; row++) {
        seats += '<div class="seat-row">';
        for (let col of ['A', 'B', 'C', ' ', 'D', 'E', 'F']) {
            if (col === ' ') {
                seats += '<span class="aisle"></span>';
            } else {
                seats += `<div class="seat" onclick="selectSeat('${row}${col}')">${row}${col}</div>`;
            }
        }
        seats += '</div>';
    }
    return seats;
}

function selectSeat(seatNumber) {
    const seats = document.querySelectorAll('.seat');
    seats.forEach(seat => seat.classList.remove('selected'));
    event.target.classList.add('selected');
    selectedSeat = seatNumber;
}

class Aircraft {
    constructor() {
        this.altitude = 0;
        this.speed = 0;
        this.heading = 0;
        this.pitch = 0;
        this.maxSpeed = 500;
        this.maxAltitude = 35000;
        
        // Get DOM elements
        this.aircraftElement = document.getElementById('aircraft');
        this.skyElement = document.getElementById('sky');
        this.groundElement = document.getElementById('ground');
        this.runwayElement = document.getElementById('runway');
        this.clouds = this.createClouds();
        
        // Bind controls
        this.setupControls();
        
        // Start flight loop
        this.startFlightLoop();

        // Add terrain features
        this.createTerrain();

        this.landingGearVisible = false; // Track landing gear state
        this.landingGearElement = document.getElementById('landing-gear'); // Add this in HTML
        this.exhaust = this.createExhaust();
    }

    setupControls() {
        document.getElementById('throttle-up').addEventListener('click', () => this.adjustSpeed(10));
        document.getElementById('throttle-down').addEventListener('click', () => this.adjustSpeed(-10));
        document.getElementById('pitch-up').addEventListener('click', () => this.adjustPitch(5));
        document.getElementById('pitch-down').addEventListener('click', () => this.adjustPitch(-5));
        document.getElementById('turn-left').addEventListener('click', () => this.turn(-10));
        document.getElementById('turn-right').addEventListener('click', () => this.turn(10));

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': this.adjustSpeed(10); break;
                case 'ArrowDown': this.adjustSpeed(-10); break;
                case 'w': this.adjustPitch(5); break;
                case 's': this.adjustPitch(-5); break;
                case 'ArrowLeft': this.turn(-10); break;
                case 'ArrowRight': this.turn(10); break;
            }
        });
    }

    adjustSpeed(delta) {
        this.speed = Math.max(0, Math.min(this.maxSpeed, this.speed + delta));
        this.updateInstruments();
    }

    adjustPitch(delta) {
        this.pitch = Math.max(-45, Math.min(45, this.pitch + delta));
        this.updateAircraftAttitude();
    }

    turn(delta) {
        this.heading = (this.heading + delta + 360) % 360;
        this.updateInstruments();
        this.updateAircraftAttitude();
    }

    updateAltitude() {
        if (this.speed > 100) { // Minimum speed for altitude change
            this.altitude += (this.pitch * this.speed / 100);
            this.altitude = Math.max(0, Math.min(this.maxAltitude, this.altitude));
        }
        this.updateInstruments();
    }

    updateAircraftAttitude() {
        if (this.aircraftElement) {
            this.aircraftElement.style.transform = `
                translateX(-50%) 
                rotate(${this.pitch}deg)
            `;
            
            // Fade out ground based on altitude
            if (this.groundElement) {
                const fadeStart = 1000;  // Start fading at 1000 feet
                const fadeEnd = 5000;   // Completely fade by 5000 feet
                const opacity = Math.max(0, 1 - (this.altitude - fadeStart) / (fadeEnd - fadeStart));
                this.groundElement.style.opacity = this.altitude < fadeStart ? 1 : opacity;
            }

            // Show clouds based on altitude
            const cloudOpacity = Math.min(1, (this.altitude - 2000) / 3000); // Clouds appear between 2000 and 5000 feet
            this.clouds.style.opacity = cloudOpacity;

            // Show runway during takeoff/landing
            if (this.runwayElement) {
                this.runwayElement.style.opacity = this.altitude < 1000 ? 1 : 0; // Visible below 1000 feet
            }

            if (this.speed > 0) {
                this.exhaust.style.opacity = 1; // Show exhaust when moving
            } else {
                this.exhaust.style.opacity = 0; // Hide exhaust when stopped
            }
        }
    }

    updateInstruments() {
        document.getElementById('altitude').textContent = Math.round(this.altitude);
        document.getElementById('speed').textContent = Math.round(this.speed);
        document.getElementById('heading').textContent = Math.round(this.heading);
    }

    startFlightLoop() {
        setInterval(() => {
            this.updateAltitude();
            this.takeoff();
            this.land();
        }, 100);
    }

    createClouds() {
        const cloudContainer = document.createElement('div');
        cloudContainer.className = 'cloud-container';
        for (let i = 0; i < 10; i++) { // Increased number of clouds
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.style.left = `${Math.random() * 100}%`;
            cloud.style.top = `${Math.random() * 50}%`;
            cloud.style.opacity = Math.random(); // Random opacity for clouds
            cloudContainer.appendChild(cloud);
        }
        document.body.appendChild(cloudContainer);
        return cloudContainer;
    }

    // Add terrain features
    createTerrain() {
        const terrainContainer = document.createElement('div');
        terrainContainer.className = 'terrain-container';
        for (let i = 0; i < 5; i++) {
            const mountain = document.createElement('div');
            mountain.className = 'mountain';
            mountain.style.left = `${Math.random() * 100}%`;
            mountain.style.bottom = `${Math.random() * 30 + 20}%`; // Random height
            terrainContainer.appendChild(mountain);
        }
        document.body.appendChild(terrainContainer);
    }

    createExhaust() {
        const exhaust = document.createElement('div');
        exhaust.className = 'exhaust';
        exhaust.style.left = '180px'; // Position near the engines
        exhaust.style.bottom = '30px'; // Adjust as needed
        document.body.appendChild(exhaust);
        return exhaust;
    }

    takeoff() {
        if (this.speed > 150) { // Minimum speed for takeoff
            this.pitch = 10; // Set pitch for takeoff
            this.landingGearVisible = false; // Hide landing gear
            this.landingGearElement.style.display = 'none'; // Hide landing gear
            document.getElementById('engine-sound').play(); // Play engine sound
        }
    }

    land() {
        if (this.altitude < 1000) {
            this.pitch = -5; // Set pitch for landing
            this.landingGearVisible = true; // Show landing gear
            this.landingGearElement.style.display = 'block'; // Show landing gear
            document.getElementById('landing-gear-sound').play(); // Play landing gear sound
        }
    }
}

// Initialize the aircraft when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const aircraft = new Aircraft();
}); 