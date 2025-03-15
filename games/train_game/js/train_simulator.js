let speed = 0;
let distance = 0;
let trainElement = document.getElementById('train');
let speedElement = document.getElementById('speed');
let distanceElement = document.getElementById('distance');
let trainInterval;
let viewportElement;
let stationElement;
let track;
let platform;
let vancouverStation;
let isFirstStart = true;
let direction = 1; // 1 for forward, -1 for backward

// Update speed limit constant
const SPEED_LIMIT = 250; // Increased from 180 to 250 km/h for higher top speed
const ACCELERATION_RATE = 0.8; // Doubled from 0.4 to 0.8 for much faster acceleration
const DECELERATION_RATE = 0.4; // Doubled from 0.2 to 0.4 for faster deceleration
const MOVEMENT_SCALE = 0.15; // Nearly doubled from 0.08 to 0.15 for much faster visual movement

let throttlePosition = 0; // Current throttle position (0-100)
let targetSpeed = 0; // Speed we're trying to reach based on throttle

// Update fuel management constants for faster consumption
const MAX_FUEL = 100;
const FUEL_CONSUMPTION_RATE = 0.05; // Increased from 0.02 to 0.05 for faster fuel consumption
let currentFuel = MAX_FUEL; // Start with full tank

// Initialize the simulation
function initializeSimulation() {
    // Create viewport
    viewportElement = document.createElement('div');
    viewportElement.className = 'viewport';
    
    // Get the container and controls/status elements
    const container = document.querySelector('.simulator-container');
    const controls = document.getElementById('controls');
    const status = document.getElementById('status');
    
    // Move only the track, platform, train, and station into viewport
    track = document.getElementById('track');
    platform = document.getElementById('platform');
    const train = document.getElementById('train');
    
    // Remove elements from container
    track.remove();
    platform.remove();
    train.remove();
    
    // Add elements to viewport
    viewportElement.appendChild(track);
    viewportElement.appendChild(platform);
    viewportElement.appendChild(train);
    
    // Create VIA station (first station)
    stationElement = document.createElement('div');
    stationElement.className = 'station';
    stationElement.style.left = '200px'; // Starting position
    viewportElement.appendChild(stationElement);
    
    // Create Jasper station (165km from VIA)
    const jasperStation = document.createElement('div');
    jasperStation.className = 'station jasper';
    jasperStation.style.left = '16700px'; // 165km * 100px per km
    viewportElement.appendChild(jasperStation);
    
    // Create Pacific Central station (345km from VIA)
    const pacificCentralStation = document.createElement('div');
    pacificCentralStation.className = 'station pacific-central';
    pacificCentralStation.style.left = '34500px'; // 345km * 100px per km
    viewportElement.appendChild(pacificCentralStation);
    
    // Create Vancouver station
    vancouverStation = document.createElement('div');
    vancouverStation.className = 'station vancouver';
    vancouverStation.style.left = '111000px'; // 1110km * 100px per km
    viewportElement.appendChild(vancouverStation);
    
    // Create Kamloops station (530km from VIA)
    const kamloopsStation = document.createElement('div');
    kamloopsStation.className = 'station kamloops';
    kamloopsStation.style.left = '53000px'; // 530km * 100px per km
    viewportElement.appendChild(kamloopsStation);
    
    // Create Union station (740km from VIA)
    const unionStation = document.createElement('div');
    unionStation.className = 'station union';
    unionStation.style.left = '74000px'; // 740km * 100px per km
    viewportElement.appendChild(unionStation);
    
    // Add viewport to container
    container.insertBefore(viewportElement, controls);
    
    // Set initial track and platform extent
    track.style.width = '120000px'; // Make sure track extends far enough
    platform.style.width = '120000px';
    
    // Set initial position
    updateViewport();

    // Initialize the throttle control
    initializeThrottleControl();

    // Start the movement loop
    trainInterval = setInterval(moveTrain, 50);

    // Create train map
    const trainMap = document.createElement('div');
    trainMap.className = 'train-map';
    
    const mapTrack = document.createElement('div');
    mapTrack.className = 'map-track';
    
    // Add stations to map
    const stations = [
        { name: 'VIA', position: 0 },
        { name: 'Jasper', position: 22.3 },      // 165km / 740km * 100
        { name: 'Pacific Central', position: 46.6 }, // 345km / 740km * 100
        { name: 'Kamloops', position: 71.6 },    // 530km / 740km * 100
        { name: 'Union', position: 100 }         // 740km / 740km * 100
    ];
    
    stations.forEach(station => {
        const mapStation = document.createElement('div');
        mapStation.className = 'map-station';
        mapStation.style.left = `${station.position}%`;
        mapStation.setAttribute('data-name', station.name);
        mapTrack.appendChild(mapStation);
    });
    
    // Add train marker
    const mapTrain = document.createElement('div');
    mapTrain.className = 'map-train';
    mapTrain.style.left = '0%';
    mapTrack.appendChild(mapTrain);
    
    trainMap.appendChild(mapTrack);
    document.body.appendChild(trainMap);

    // Store map train reference
    window.mapTrain = mapTrain;

    // Add after creating the train in initializeSimulation
    const carriage = document.createElement('div');
    carriage.className = 'carriage';
    viewportElement.appendChild(carriage);

    // After creating carriages, add the rear locomotive
    addRearLocomotive();

    // Hide the distance display container
    const distanceContainer = document.querySelector('.distance-gauge');
    if (distanceContainer) {
        distanceContainer.style.display = 'none';
    }
}

// Completely rewrite the throttle control functionality
function initializeThrottleControl() {
    // Remove any existing throttle controls
    const existingControls = document.querySelectorAll('.locomotive-control-panel');
    existingControls.forEach(control => control.remove());
    
    // Create the main control panel container
    const controlPanel = document.createElement('div');
    controlPanel.className = 'locomotive-control-panel';
    
    // Create the control panel HTML with fuel gauge and station panel button inside emergency section
    controlPanel.innerHTML = `
        <div class="panel-header">
            <div class="panel-title">LOCOMOTIVE CONTROL STAND</div>
        </div>
        
        <div class="panel-gauges">
            <div class="gauge speed-gauge">
                <div class="gauge-dial">
                    <div class="gauge-needle" id="speed-needle"></div>
                    <div class="gauge-center"></div>
                </div>
                <div class="gauge-label">SPEED</div>
                <div class="gauge-value" id="speed">0.00</div>
                <div class="gauge-unit">km/h</div>
            </div>
            
            <div class="gauge fuel-gauge">
                <div class="gauge-dial">
                    <div class="gauge-needle" id="fuel-needle"></div>
                    <div class="gauge-center"></div>
                </div>
                <div class="gauge-label">FUEL</div>
                <div class="gauge-value" id="fuel">100</div>
                <div class="gauge-unit">%</div>
            </div>
        </div>
        
        <div class="control-stand">
            <div class="throttle-section">
                <div class="throttle-label">THROTTLE</div>
                <div class="throttle-track">
                    <div class="throttle-notches">
                        <div class="throttle-notch active" data-value="0">IDLE</div>
                        <div class="throttle-notch" data-value="12.5">1</div>
                        <div class="throttle-notch" data-value="25">2</div>
                        <div class="throttle-notch" data-value="37.5">3</div>
                        <div class="throttle-notch" data-value="50">4</div>
                        <div class="throttle-notch" data-value="62.5">5</div>
                        <div class="throttle-notch" data-value="75">6</div>
                        <div class="throttle-notch" data-value="87.5">7</div>
                        <div class="throttle-notch" data-value="100">8</div>
                    </div>
                    <div class="throttle-handle" id="throttle-handle"></div>
                </div>
            </div>
            
            <div class="brake-section">
                <div class="brake-label">BRAKE</div>
                <div class="brake-track">
                    <div class="brake-notches">
                        <div class="brake-notch active" data-value="0">OFF</div>
                        <div class="brake-notch" data-value="1">1</div>
                        <div class="brake-notch" data-value="2">2</div>
                        <div class="brake-notch" data-value="3">3</div>
                        <div class="brake-notch" data-value="4">4</div>
                        <div class="brake-notch" data-value="5">5</div>
                        <div class="brake-notch" data-value="6">6</div>
                    </div>
                    <div class="brake-handle" id="brake-handle"></div>
                </div>
            </div>
            
            <div class="direction-section">
                <div class="direction-label">DIRECTION</div>
                <div class="direction-control">
                    <div class="direction-option" data-direction="-1">REVERSE</div>
                    <div class="direction-option" data-direction="0">NEUTRAL</div>
                    <div class="direction-option active" data-direction="1">FORWARD</div>
                </div>
            </div>
            
            <div class="emergency-section">
                <button id="emergency-brake-btn" class="emergency-brake-button">
                    EMERGENCY<br>BRAKE
                </button>
                
                <!-- Add station panel button directly under emergency brake -->
                <button id="station-panel-access-btn" class="station-panel-button">Station Panel</button>
            </div>
        </div>
        
        <div id="brake-sparks" class="brake-sparks"></div>
    `;
    
    // Add the control panel to the body
    document.body.appendChild(controlPanel);
    
    // Reset throttle and brake positions
    throttlePosition = 0;
    let brakePosition = 0;
    
    // Get handle elements after they've been added to the DOM
    const throttleHandle = document.getElementById('throttle-handle');
    const brakeHandle = document.getElementById('brake-handle');
    
    // Get track elements
    const throttleTrack = document.querySelector('.throttle-track');
    const brakeTrack = document.querySelector('.brake-track');
    
    // Initialize drag state
    let isDraggingThrottle = false;
    let isDraggingBrake = false;
    
    // Set initial handle positions - IMPORTANT: This must happen after elements are in the DOM
    setTimeout(() => {
        // Position throttle at IDLE (bottom)
        const throttleTrackHeight = throttleTrack.offsetHeight - throttleHandle.offsetHeight;
        throttleHandle.style.top = `${throttleTrackHeight}px`;
        
        // Position brake at OFF (top)
        brakeHandle.style.top = '0px';
        
        console.log("Throttle handle positioned at:", throttleHandle.style.top);
    }, 100);
    
    // Set up throttle notch click events
    const throttleNotches = document.querySelectorAll('.throttle-notch');
    throttleNotches.forEach(notch => {
        notch.addEventListener('click', function() {
            // If brake is applied, don't allow throttle increase
            if (brakePosition > 0 && parseFloat(this.getAttribute('data-value')) > 0) {
                alert('Release brake before applying throttle');
                return;
            }
            
            const value = parseFloat(this.getAttribute('data-value'));
            updateThrottle(value);
            
            // Update handle position
            const trackHeight = throttleTrack.offsetHeight - throttleHandle.offsetHeight;
            const position = trackHeight - (value / 100 * trackHeight);
            throttleHandle.style.top = `${position}px`;
            
            // Update active notch
            throttleNotches.forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Set up brake notch click events
    const brakeNotches = document.querySelectorAll('.brake-notch');
    brakeNotches.forEach(notch => {
        notch.addEventListener('click', function() {
            // If throttle is applied, don't allow brake increase
            if (throttlePosition > 0 && parseInt(this.getAttribute('data-value')) > 0) {
                alert('Bring throttle to IDLE before applying brake');
                return;
            }
            
            const value = parseInt(this.getAttribute('data-value'));
            brakePosition = value;
            
            // Apply braking effect
            if (value > 0) {
                // More gradual braking - reduce the multiplier
                const brakeForce = value * 0.3; // Reduced from 0.5 to 0.3
                
                // Don't set target speed to 0 immediately for more gradual braking
                if (value >= 5) {
                    // Even at maximum brake, approach zero gradually
                    targetSpeed = 0;
                } else {
                    // Gradually reduce target speed based on brake position
                    const brakeEffectiveness = value / 6; // 0 to 0.83 for brake positions 0-5
                    targetSpeed = (1 - brakeEffectiveness) * (throttlePosition / 100) * SPEED_LIMIT * direction;
                }
                
                // Show brake sparks if speed is high and brake is applied
                if (Math.abs(speed) > 40 && value > 2) {
                    showBrakeSparks();
                }
            }
            
            // Update handle position
            const trackHeight = brakeTrack.offsetHeight - brakeHandle.offsetHeight;
            const position = (value / 6) * trackHeight;
            brakeHandle.style.top = `${position}px`;
            
            // Update active notch
            brakeNotches.forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Set up throttle handle drag events
    throttleHandle.addEventListener('mousedown', function(e) {
        isDraggingThrottle = true;
        document.addEventListener('mousemove', handleThrottleDrag);
        document.addEventListener('mouseup', stopThrottleDrag);
        e.preventDefault();
    });
    
    // Set up brake handle drag events
    brakeHandle.addEventListener('mousedown', function(e) {
        isDraggingBrake = true;
        document.addEventListener('mousemove', handleBrakeDrag);
        document.addEventListener('mouseup', stopBrakeDrag);
        e.preventDefault();
    });
    
    function handleThrottleDrag(e) {
        if (!isDraggingThrottle) return;
        
        // If brake is applied, don't allow throttle increase
        if (brakePosition > 0) {
            alert('Release brake before applying throttle');
            isDraggingThrottle = false;
            document.removeEventListener('mousemove', handleThrottleDrag);
            document.removeEventListener('mouseup', stopThrottleDrag);
            return;
        }
        
        const trackRect = throttleTrack.getBoundingClientRect();
        const trackHeight = trackRect.height;
        const handleHeight = throttleHandle.offsetHeight;
        
        // Calculate position relative to track
        let relativeY = e.clientY - trackRect.top - (handleHeight / 2);
        
        // Constrain to track bounds
        relativeY = Math.max(0, Math.min(relativeY, trackHeight - handleHeight));
        
        // Set handle position
        throttleHandle.style.top = `${relativeY}px`;
        
        // Convert to throttle value (0-100)
        const value = 100 - (relativeY / (trackHeight - handleHeight) * 100);
        throttlePosition = value;
        
        // Calculate target speed based on throttle position
        targetSpeed = (value / 100) * SPEED_LIMIT * direction;
        
        // Update active notch
        const nearestNotch = findNearestThrottleNotch(value);
        throttleNotches.forEach(notch => {
            const notchValue = parseFloat(notch.getAttribute('data-value'));
            if (notchValue === nearestNotch) {
                notch.classList.add('active');
            } else {
                notch.classList.remove('active');
            }
        });
    }
    
    function handleBrakeDrag(e) {
        if (!isDraggingBrake) return;
        
        // If throttle is applied, don't allow brake increase
        if (throttlePosition > 0) {
            alert('Bring throttle to IDLE before applying brake');
            isDraggingBrake = false;
            document.removeEventListener('mousemove', handleBrakeDrag);
            document.removeEventListener('mouseup', stopBrakeDrag);
            return;
        }
        
        const trackRect = brakeTrack.getBoundingClientRect();
        const trackHeight = trackRect.height;
        const handleHeight = brakeHandle.offsetHeight;
        
        // Calculate position relative to track
        let relativeY = e.clientY - trackRect.top - (handleHeight / 2);
        
        // Constrain to track bounds
        relativeY = Math.max(0, Math.min(relativeY, trackHeight - handleHeight));
        
        // Set handle position
        brakeHandle.style.top = `${relativeY}px`;
        
        // Convert to brake value (0-6)
        const value = Math.round((relativeY / (trackHeight - handleHeight)) * 6);
        brakePosition = value;
        
        // Apply braking effect
        if (value > 0) {
            // More gradual braking - reduce the multiplier
            const brakeForce = value * 0.4; // Reduced from 0.8 to 0.4
            
            // Apply braking with more gradual effect
            if (speed > 0) {
                speed = Math.max(0, speed - brakeForce);
            } else if (speed < 0) {
                speed = Math.min(0, speed + brakeForce);
            }
            
            // Show brake sparks if speed is high and brake is applied
            if (Math.abs(speed) > 40 && value > 2) {
                showBrakeSparks();
            } else {
                hideBrakeSparks();
            }
        } else {
            hideBrakeSparks();
        }
        
        // Update active notch
        brakeNotches.forEach(notch => {
            const notchValue = parseInt(notch.getAttribute('data-value'));
            if (notchValue === value) {
                notch.classList.add('active');
            } else {
                notch.classList.remove('active');
            }
        });
    }
    
    function stopThrottleDrag() {
        if (!isDraggingThrottle) return;
        
        isDraggingThrottle = false;
        document.removeEventListener('mousemove', handleThrottleDrag);
        document.removeEventListener('mouseup', stopThrottleDrag);
        
        // Snap to nearest notch
        const nearestNotch = findNearestThrottleNotch(throttlePosition);
        updateThrottle(nearestNotch);
        
        // Update handle position
        const trackHeight = throttleTrack.offsetHeight - throttleHandle.offsetHeight;
        const position = trackHeight - (nearestNotch / 100 * trackHeight);
        throttleHandle.style.top = `${position}px`;
        
        // Update active notch
        throttleNotches.forEach(notch => {
            const notchValue = parseFloat(notch.getAttribute('data-value'));
            if (notchValue === nearestNotch) {
                notch.classList.add('active');
            } else {
                notch.classList.remove('active');
            }
        });
    }
    
    function stopBrakeDrag() {
        if (!isDraggingBrake) return;
        
        isDraggingBrake = false;
        document.removeEventListener('mousemove', handleBrakeDrag);
        document.removeEventListener('mouseup', stopBrakeDrag);
        
        // Snap to nearest notch
        const nearestNotch = Math.round(brakePosition);
        brakePosition = nearestNotch;
        
        // Update handle position
        const trackHeight = brakeTrack.offsetHeight - brakeHandle.offsetHeight;
        const position = (nearestNotch / 6) * trackHeight;
        brakeHandle.style.top = `${position}px`;
        
        // Update active notch
        brakeNotches.forEach(notch => {
            const notchValue = parseInt(notch.getAttribute('data-value'));
            if (notchValue === nearestNotch) {
                notch.classList.add('active');
            } else {
                notch.classList.remove('active');
            }
        });
    }
    
    function findNearestThrottleNotch(value) {
        const notchValues = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
        return notchValues.reduce((prev, curr) => 
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
    }
    
    function updateThrottle(value) {
        throttlePosition = value;
        
        // Calculate target speed based on throttle position and direction with a super responsive curve
        const throttlePercentage = value / 100;
        // Use an even more aggressive throttle response for extremely fast acceleration
        const throttleCurve = Math.pow(throttlePercentage, 0.7); // Reduced exponent from 0.9 to 0.7 for extremely responsive throttle
        targetSpeed = throttleCurve * SPEED_LIMIT * direction;
    }
    
    // Function to show brake sparks
    function showBrakeSparks() {
        // Remove any existing sparks
        const existingSparks = document.querySelectorAll('.brake-sparks');
        existingSparks.forEach(spark => spark.remove());
        
        // Create a new sparks container
        const sparkContainer = document.createElement('div');
        sparkContainer.className = 'brake-sparks';
        sparkContainer.id = 'brake-sparks';
        
        // Position it at the train's wheels
        sparkContainer.style.position = 'absolute';
        sparkContainer.style.bottom = '50px'; // Just above the track
        sparkContainer.style.left = '0';      // At the train's position
        sparkContainer.style.width = '400px'; // Width of the train
        sparkContainer.style.height = '30px';
        sparkContainer.style.display = 'block';
        sparkContainer.style.zIndex = '100';
        sparkContainer.style.pointerEvents = 'none';
        
        // Add to viewport instead of control panel
        viewportElement.appendChild(sparkContainer);
        
        // Create multiple spark elements at wheel positions with more variety
        const wheelPositions = [50, 150, 250, 350]; // X positions of wheels
        
        // Intensity based on speed and brake position
        const intensity = Math.min(1, Math.abs(speed) / 100) * (brakePosition / 6);
        const sparkCount = Math.floor(intensity * 10) + 5; // 5-15 sparks per wheel
        
        wheelPositions.forEach(wheelPos => {
            // Create more sparks per wheel for higher intensity
            for (let i = 0; i < sparkCount; i++) {
                const spark = document.createElement('div');
                spark.className = 'spark';
                
                // Position at wheel with more randomness
                const offsetX = (Math.random() * 20) - 10;
                spark.style.left = `${wheelPos + offsetX}px`;
                
                // Random animation duration and size for variety
                const animDuration = 0.3 + Math.random() * 0.7;
                spark.style.animationDuration = `${animDuration}s`;
                spark.style.animationDelay = `${Math.random() * 0.3}s`;
                
                // Vary the spark size
                const size = 2 + Math.random() * 4;
                spark.style.width = `${size}px`;
                spark.style.height = `${size}px`;
                
                // Vary the spark color (orange to yellow)
                const hue = 20 + Math.floor(Math.random() * 40);
                spark.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                spark.style.boxShadow = `0 0 ${8 + size}px 3px hsl(${hue}, 100%, 50%)`;
                
                sparkContainer.appendChild(spark);
            }
        });
        
        // Also add sparks to any carriages and rear locomotive
        const carriages = document.querySelectorAll('.carriage');
        carriages.forEach((carriage, index) => {
            const carriageLeft = parseInt(carriage.style.left || '-420px');
            
            // Create sparks container for this carriage
            const carriageSparkContainer = document.createElement('div');
            carriageSparkContainer.className = 'brake-sparks';
            carriageSparkContainer.style.position = 'absolute';
            carriageSparkContainer.style.bottom = '50px';
            carriageSparkContainer.style.left = `${carriageLeft}px`;
            carriageSparkContainer.style.width = '400px';
            carriageSparkContainer.style.height = '30px';
            carriageSparkContainer.style.display = 'block';
            carriageSparkContainer.style.zIndex = '100';
            carriageSparkContainer.style.pointerEvents = 'none';
            
            viewportElement.appendChild(carriageSparkContainer);
            
            // Add sparks at wheel positions
            wheelPositions.forEach(wheelPos => {
                for (let i = 0; i < sparkCount; i++) {
                    const spark = document.createElement('div');
                    spark.className = 'spark';
                    
                    const offsetX = (Math.random() * 20) - 10;
                    spark.style.left = `${wheelPos + offsetX}px`;
                    
                    const animDuration = 0.3 + Math.random() * 0.7;
                    spark.style.animationDuration = `${animDuration}s`;
                    spark.style.animationDelay = `${Math.random() * 0.3}s`;
                    
                    // Vary the spark size
                    const size = 2 + Math.random() * 4;
                    spark.style.width = `${size}px`;
                    spark.style.height = `${size}px`;
                    
                    // Vary the spark color
                    const hue = 20 + Math.floor(Math.random() * 40);
                    spark.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
                    spark.style.boxShadow = `0 0 ${8 + size}px 3px hsl(${hue}, 100%, 50%)`;
                    
                    carriageSparkContainer.appendChild(spark);
                }
            });
        });
    }
    
    // Function to hide brake sparks
    function hideBrakeSparks() {
        const sparkContainers = document.querySelectorAll('.brake-sparks');
        sparkContainers.forEach(container => {
            container.remove();
        });
    }
    
    // Set up direction control
    const directionOptions = document.querySelectorAll('.direction-option');
    directionOptions.forEach(option => {
        option.addEventListener('click', function() {
            const dirValue = parseInt(this.getAttribute('data-direction'));
            
            // Only allow direction change if at idle and no brake
            if ((throttlePosition > 0 || brakePosition > 0) && dirValue !== direction) {
                alert('Bring throttle to IDLE and release brake before changing direction');
                return;
            }
            
            // Set the direction
            direction = dirValue;
            
            // Update target speed based on new direction
            if (throttlePosition > 0) {
                targetSpeed = (throttlePosition / 100) * SPEED_LIMIT * direction;
            }
            
            // Update active state
            directionOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Update the train appearance based on direction
            if (direction === -1) {
                // When in reverse, swap the locomotive and rear locomotive appearances
                swapLocomotiveAppearance(true);
            } else if (direction === 1) {
                // When going forward, restore original appearance
                swapLocomotiveAppearance(false);
            }
        });
    });
    
    // Set up emergency stop
    const emergencyButton = document.getElementById('emergency-brake-btn');
    emergencyButton.addEventListener('click', function() {
        // Emergency stop applies maximum brake and cuts throttle
        throttlePosition = 0;
        brakePosition = 6;
        targetSpeed = 0;
        
        // Update throttle handle position
        const throttleTrackHeight = throttleTrack.offsetHeight - throttleHandle.offsetHeight;
        throttleHandle.style.top = `${throttleTrackHeight}px`;
        
        // Update brake handle position
        const brakeTrackHeight = brakeTrack.offsetHeight - brakeHandle.offsetHeight;
        brakeHandle.style.top = `${brakeTrackHeight}px`;
        
        // Update active notches
        throttleNotches.forEach(notch => {
            if (parseFloat(notch.getAttribute('data-value')) === 0) {
                notch.classList.add('active');
            } else {
                notch.classList.remove('active');
            }
        });
        
        brakeNotches.forEach(notch => {
            if (parseInt(notch.getAttribute('data-value')) === 6) {
                notch.classList.add('active');
            } else {
                notch.classList.remove('active');
            }
        });
        
        // Show brake sparks
        if (Math.abs(speed) > 30) {
            showBrakeSparks();
        }
        
        // Visual feedback
        this.classList.add('pressed');
        setTimeout(() => {
            this.classList.remove('pressed');
        }, 300);
    });
    
    // Update speed and distance elements
    speedElement = document.getElementById('speed');
    distanceElement = document.getElementById('distance');
    
    // Set up gauge needle update
    setInterval(updateGauges, 50);
    
    // Function to update gauge needles
    function updateGauges() {
        const speedNeedle = document.getElementById('speed-needle');
        const fuelNeedle = document.getElementById('fuel-needle');
        
        if (speedNeedle) {
            // Speed gauge (0-300 km/h maps to 0-270 degrees)
            const speedAngle = Math.min(270, (Math.abs(speed) / 300) * 270);
            speedNeedle.style.transform = `rotate(${speedAngle}deg)`;
        }
        
        if (fuelNeedle) {
            // Fuel gauge (0-100% maps to 0-270 degrees)
            const fuelAngle = Math.min(270, (currentFuel / MAX_FUEL) * 270);
            fuelNeedle.style.transform = `rotate(${fuelAngle}deg)`;
            
            // Update fuel display
            const fuelDisplay = document.getElementById('fuel');
            if (fuelDisplay) {
                fuelDisplay.textContent = Math.round(currentFuel);
            }
            
            // Change color based on fuel level
            if (currentFuel < 20) {
                fuelNeedle.style.backgroundColor = '#ff0000'; // Red for low fuel
            } else if (currentFuel < 40) {
                fuelNeedle.style.backgroundColor = '#ff9900'; // Orange for medium-low fuel
            } else {
                fuelNeedle.style.backgroundColor = '#00cc00'; // Green for good fuel level
            }
        }
    }
    
    // Add event listener for the station panel button
    const stationPanelButton = document.getElementById('station-panel-access-btn');
    if (stationPanelButton) {
        stationPanelButton.addEventListener('click', () => {
            // Check if at a station
            const trainLeft = parseFloat(trainElement.style.left || '0');
            const isAtStation = checkIfAtStation(trainLeft);
            
            if (isAtStation.atStation) {
                showStationPanel(isAtStation.stationName);
            } else {
                showNotification('Cannot access station services while on the rail! You must be at a station.');
                
                // Visually indicate the button is disabled
                stationPanelButton.classList.add('disabled');
                setTimeout(() => {
                    stationPanelButton.classList.remove('disabled');
                }, 2000);
            }
        });
    }
    
    // Start fuel consumption
    setInterval(consumeFuel, 1000);
    
    // Initialize fuel gauge
    updateFuelGauge();
}

// Function to check if train is at a station with a larger detection area
function checkIfAtStation(trainPosition) {
    // Define station positions in pixels
    const stations = [
        { name: 'VIA', position: 200, width: 2000 },
        { name: 'Jasper', position: 16700, width: 2000 },
        { name: 'Pacific Central', position: 34500, width: 2000 },
        { name: 'Kamloops', position: 53000, width: 2000 },
        { name: 'Union', position: 74000, width: 2000 }
    ];
    
    // Check if train is at any station
    let atStation = false;
    let stationName = '';
    
    stations.forEach(station => {
        // Train is considered at a station if within the entire station width
        // Use half the width on each side of the station center position
        const stationStart = station.position - (station.width / 2);
        const stationEnd = station.position + (station.width / 2);
        
        if (trainPosition >= stationStart && trainPosition <= stationEnd) {
            atStation = true;
            stationName = station.name;
        }
    });
    
    return { atStation, stationName };
}

// Update the checkStation function to use the new checkIfAtStation function
function checkStation(trainPosition) {
    const stationStatus = checkIfAtStation(trainPosition);
    
    // Update station arrival message and show station panel button
    const arrivalMessage = document.getElementById('arrival-message');
    if (stationStatus.atStation) {
        // Create or update arrival message with station panel button
        if (!arrivalMessage) {
            const newArrivalMessage = document.createElement('div');
            newArrivalMessage.id = 'arrival-message';
            newArrivalMessage.innerHTML = `
                <div>You have arrived at ${stationStatus.stationName} station</div>
                <button id="station-panel-btn" class="station-panel-button">Station Panel</button>
            `;
            document.body.appendChild(newArrivalMessage);
            
            // Add event listener to the button
            document.getElementById('station-panel-btn').addEventListener('click', () => {
                showStationPanel(stationStatus.stationName);
            });
        } else {
            arrivalMessage.innerHTML = `
                <div>You have arrived at ${stationStatus.stationName} station</div>
                <button id="station-panel-btn" class="station-panel-button">Station Panel</button>
            `;
            arrivalMessage.style.display = 'block';
            
            // Add event listener to the button
            document.getElementById('station-panel-btn').addEventListener('click', () => {
                showStationPanel(stationStatus.stationName);
            });
        }
    } else if (arrivalMessage) {
        arrivalMessage.style.display = 'none';
    }
}

// Function to update the fuel gauge
function updateFuelGauge() {
    const fuelNeedle = document.getElementById('fuel-needle');
    const fuelDisplay = document.getElementById('fuel');
    
    if (fuelNeedle) {
        // Fuel gauge (0-100% maps to 0-270 degrees)
        const fuelAngle = Math.min(270, (currentFuel / MAX_FUEL) * 270);
        fuelNeedle.style.transform = `rotate(${fuelAngle}deg)`;
        
        // Change color based on fuel level
        if (currentFuel < 20) {
            fuelNeedle.style.backgroundColor = '#ff0000'; // Red for low fuel
        } else if (currentFuel < 40) {
            fuelNeedle.style.backgroundColor = '#ff9900'; // Orange for medium-low fuel
        } else {
            fuelNeedle.style.backgroundColor = '#00cc00'; // Green for good fuel level
        }
    }
    
    if (fuelDisplay) {
        fuelDisplay.textContent = Math.round(currentFuel);
    }
}

// Update the consumeFuel function to make fuel go down faster
function consumeFuel() {
    if (Math.abs(speed) > 0) {
        // Consume fuel based on speed and throttle position with increased consumption
        const consumptionMultiplier = 0.8 + (throttlePosition / 100) * 2.0; // Increased from 0.5 to 0.8 and 1.5 to 2.0
        const speedFactor = Math.abs(speed) / SPEED_LIMIT;
        
        currentFuel = Math.max(0, currentFuel - (FUEL_CONSUMPTION_RATE * consumptionMultiplier * speedFactor));
        
        // Update fuel gauge
        updateFuelGauge();
        
        // If fuel is empty, stop the train
        if (currentFuel <= 0) {
            throttlePosition = 0;
            targetSpeed = 0;
            
            // Show out of fuel message
            showNotification('Out of fuel! Please refuel at a station.');
        }
    }
}

// Add this function to swap locomotive appearance when in reverse
function swapLocomotiveAppearance(isReverse) {
    const trainElement = document.getElementById('train');
    const rearLocomotive = document.getElementById('rear-locomotive');
    
    if (!trainElement || !rearLocomotive) return;
    
    if (isReverse) {
        // Store original styles
        if (!trainElement.dataset.originalStyle) {
            trainElement.dataset.originalStyle = trainElement.style.backgroundImage;
        }
        if (!rearLocomotive.dataset.originalStyle) {
            rearLocomotive.dataset.originalStyle = rearLocomotive.style.backgroundImage;
        }
        
        // In reverse mode, make the rear locomotive look like it's leading
        // Add headlights to rear locomotive and taillights to front locomotive
        const rearStyle = rearLocomotive.style.backgroundImage;
        const updatedRearStyle = rearStyle.replace('</svg>', `
            <!-- Headlights for reverse mode -->
            <circle cx="5" cy="45" r="4" fill="%23fff" filter="url(%23headlightGlow)"/>
            <circle cx="5" cy="70" r="4" fill="%23fff" filter="url(%23headlightGlow)"/>
            <defs>
                <filter id="headlightGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
            </defs>
        </svg>`);
        
        rearLocomotive.style.backgroundImage = updatedRearStyle;
        
        // Add red taillights to the front locomotive
        const frontStyle = trainElement.style.backgroundImage;
        const updatedFrontStyle = frontStyle.replace('</svg>', `
            <!-- Taillights for reverse mode -->
            <circle cx="395" cy="45" r="3" fill="%23ff0000"/>
            <circle cx="395" cy="70" r="3" fill="%23ff0000"/>
        </svg>`);
        
        trainElement.style.backgroundImage = updatedFrontStyle;
    } else {
        // Restore original styles when going forward
        if (trainElement.dataset.originalStyle) {
            trainElement.style.backgroundImage = trainElement.dataset.originalStyle;
        }
        if (rearLocomotive.dataset.originalStyle) {
            rearLocomotive.style.backgroundImage = rearLocomotive.dataset.originalStyle;
        }
    }
}

// Update the moveTrain function to consistently update all speed displays
function moveTrain() {
    // Apply acceleration/deceleration based on target speed
    if (Math.abs(speed) < Math.abs(targetSpeed)) {
        if (targetSpeed > 0) {
            const currentAcceleration = ACCELERATION_RATE * (1 - (Math.abs(speed) / SPEED_LIMIT) * 0.1);
            speed = Math.min(targetSpeed, speed + currentAcceleration);
        } else if (targetSpeed < 0) {
            const currentAcceleration = ACCELERATION_RATE * (1 - (Math.abs(speed) / SPEED_LIMIT) * 0.1);
            speed = Math.max(targetSpeed, speed - currentAcceleration);
        }
    } else if (Math.abs(speed) > Math.abs(targetSpeed)) {
        if (speed > targetSpeed) {
            speed = Math.max(targetSpeed, speed - DECELERATION_RATE);
        } else if (speed < targetSpeed) {
            speed = Math.min(targetSpeed, speed + DECELERATION_RATE);
        }
    }

    // Update train position
    const trainLeft = parseFloat(trainElement.style.left || '0');
    trainElement.style.left = (trainLeft + (speed * MOVEMENT_SCALE)) + 'px';

    // Update carriage positions
    updateCarriagePositions(speed);

    // Update viewport
    updateViewport();

    // Centralize speed display updates
    updateSpeedDisplays();

    // Update map train position based on train's actual position
    if (window.mapTrain) {
        // Define station positions in pixels
        const stationPositions = [
            { name: 'VIA', position: 200 },
            { name: 'Jasper', position: 16700 },
            { name: 'Pacific Central', position: 34500 },
            { name: 'Kamloops', position: 53000 },
            { name: 'Union', position: 74000 }
        ];
        
        // Calculate map position based on actual train position relative to stations
        // Total track length in pixels
        const totalTrackLength = 74000; // Union station position
        
        // Calculate percentage of journey completed
        const journeyPercentage = Math.min(100, Math.max(0, (trainLeft / totalTrackLength) * 100));
        
        // Update map train position
        window.mapTrain.style.left = `${journeyPercentage}%`;
        
        // Update map train tooltip to show current position
        let currentLocation = "On the rail";
        
        // Check if at a station
        const stationStatus = checkIfAtStation(trainLeft);
        if (stationStatus.atStation) {
            currentLocation = `At ${stationStatus.stationName} Station`;
        } else {
            // Find nearest stations
            let prevStation = { name: "Start", position: 0 };
            let nextStation = { name: "End", position: totalTrackLength };
            
            for (let i = 0; i < stationPositions.length; i++) {
                if (trainLeft >= stationPositions[i].position) {
                    prevStation = stationPositions[i];
                } else {
                    nextStation = stationPositions[i];
                    break;
                }
            }
            
            // Calculate distance to next station
            const distanceToNext = nextStation.position - trainLeft;
            const distanceFromPrev = trainLeft - prevStation.position;
            
            if (distanceToNext < distanceFromPrev) {
                currentLocation = `${Math.round(distanceToNext / 100) / 10} km to ${nextStation.name}`;
            } else {
                currentLocation = `${Math.round(distanceFromPrev / 100) / 10} km from ${prevStation.name}`;
            }
        }
        
        window.mapTrain.setAttribute('title', currentLocation);
    }
    
    // Check if at station and update button state
    const stationStatus = checkIfAtStation(trainLeft);
    const stationPanelButton = document.getElementById('station-panel-access-btn');
    
    if (stationPanelButton) {
        if (stationStatus.atStation) {
            stationPanelButton.classList.remove('disabled');
            stationPanelButton.title = `Access ${stationStatus.stationName} station services`;
        } else {
            if (!stationPanelButton.classList.contains('disabled')) {
                stationPanelButton.classList.add('disabled');
            }
            stationPanelButton.title = 'Station services only available when at a station';
        }
    }
}

// Add new function to update all speed displays consistently
function updateSpeedDisplays() {
    const currentSpeedKmh = Math.abs(Math.round(speed));
    
    // Update control stand speed display
    if (speedElement) {
        speedElement.textContent = currentSpeedKmh.toFixed(2);
    }

    // Update top-right speed display
    const topSpeedDisplay = document.querySelector('.speed-gauge .gauge-value');
    if (topSpeedDisplay) {
        topSpeedDisplay.textContent = currentSpeedKmh.toFixed(2);
    }

    // Update speed needle
    const speedNeedle = document.getElementById('speed-needle');
    if (speedNeedle) {
        const speedAngle = Math.min(270, (currentSpeedKmh / SPEED_LIMIT) * 270);
        speedNeedle.style.transform = `rotate(${speedAngle}deg)`;
    }
}

// Update the updateCarriagePositions function to handle reverse movement
function updateCarriagePositions(currentSpeed) {
    const carriages = document.querySelectorAll('.carriage');
    const trainLeft = parseFloat(trainElement.style.left || '0');
    
    carriages.forEach((carriage, index) => {
        // Position each carriage behind the train or previous carriage
        const offset = -420 * (index + 1); // 420px spacing between carriages
        carriage.style.left = (trainLeft + offset) + 'px';
    });
    
    // Update rear locomotive position
    const rearLocomotive = document.getElementById('rear-locomotive');
    if (rearLocomotive) {
        const carriageCount = carriages.length;
        const rearOffset = -420 * (carriageCount + 1);
        rearLocomotive.style.left = (trainLeft + rearOffset) + 'px';
    }
}

// Update the status display
function updateStatus() {
    speedElement.textContent = Math.round(speed);
    distanceElement.textContent = distance.toFixed(2);
    
    // Show warning if speed is at limit
    if (speed >= SPEED_LIMIT - 1) {
        if (!document.getElementById('speed-warning')) {
            const warning = document.createElement('div');
            warning.id = 'speed-warning';
            warning.textContent = 'Maximum Speed Reached!';
            warning.style.position = 'fixed';
            warning.style.top = '60px';
            warning.style.left = '50%';
            warning.style.transform = 'translateX(-50%)';
            warning.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            warning.style.color = 'white';
            warning.style.padding = '10px';
            warning.style.borderRadius = '5px';
            warning.style.zIndex = '1000';
            document.body.appendChild(warning);
            
            setTimeout(() => {
                warning.remove();
            }, 2000);
        }
    }
}

// Modify the updateViewport function to show more of the train
function updateViewport() {
    // Get the current train position
    const trainLeft = parseInt(trainElement.style.left) || 0;
    
    // Calculate viewport position - show more of the train by shifting the view
    // This will ensure we can see the rear locomotive
    const viewportLeft = -trainLeft + window.innerWidth / 3;
    
    // Apply the new position
    viewportElement.style.transform = `translateX(${viewportLeft}px)`;
    
    // Update distance display
    distance = Math.abs(trainLeft) * MOVEMENT_SCALE;
    distanceElement.textContent = distance.toFixed(2) + ' km';
    
    // Update map train position
    if (window.mapTrain) {
        const maxDistance = 740; // km
        const percentPosition = Math.min(100, (distance / maxDistance) * 100);
        window.mapTrain.style.left = `${percentPosition}%`;
    }
}

// Function to show station panel with station-specific information
function showStationPanel(stationName) {
    // Remove any existing panel
    const existingPanel = document.getElementById('station-services-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'station-panel-overlay';
    document.body.appendChild(overlay);
    
    // Create station services panel
    const panel = document.createElement('div');
    panel.id = 'station-services-panel';
    panel.className = 'station-services-panel';
    
    // Get station-specific information
    const stationInfo = getStationInfo(stationName);
    
    panel.innerHTML = `
        <div class="station-panel-header">
            <h2>${stationName} Station Services</h2>
            <button id="close-station-panel" class="close-panel-btn">×</button>
        </div>
        <div class="station-panel-content">
            <div class="station-info">
                <p>${stationInfo.description}</p>
            </div>
            
            <div class="station-service-item">
                <div class="service-info">
                    <h3>Fuel Status</h3>
                    <div class="fuel-level-bar">
                        <div class="fuel-level-fill" style="width: ${currentFuel}%"></div>
                    </div>
                    <p>Current fuel: ${Math.round(currentFuel)}%</p>
                </div>
                <button id="refuel-btn" class="service-btn">Refuel</button>
            </div>
            
            <div class="station-service-item">
                <div class="service-info">
                    <h3>Supplies</h3>
                    <p>Stock up on food, water, and other essentials for your journey.</p>
                </div>
                <button id="supplies-btn" class="service-btn">Stock Up</button>
            </div>
        </div>
    `;
    
    // Add to body to ensure it's above all other elements
    document.body.appendChild(panel);
    
    // Add event listeners to buttons
    document.getElementById('close-station-panel').addEventListener('click', () => {
        panel.remove();
        overlay.remove();
    });
    
    document.getElementById('refuel-btn').addEventListener('click', () => {
        refuelTrain();
        updateStationPanel();
    });
    
    document.getElementById('supplies-btn').addEventListener('click', () => {
        stockSupplies();
    });
    
    // Function to update the station panel
    function updateStationPanel() {
        const fuelFill = panel.querySelector('.fuel-level-fill');
        const fuelText = panel.querySelector('.service-info p');
        
        fuelFill.style.width = `${currentFuel}%`;
        fuelText.textContent = `Current fuel: ${Math.round(currentFuel)}%`;
    }
}

// Function to get station-specific information
function getStationInfo(stationName) {
    const stationInfoMap = {
        'VIA': {
            description: 'Welcome to VIA Station! This is the starting point of your journey. The station offers full refueling and supply services.',
            fuelPrice: 1.0 // Base price
        },
        'Jasper': {
            description: 'Jasper Station is located in the beautiful Jasper National Park. The station offers premium services with a view of the Rocky Mountains.',
            fuelPrice: 1.2 // 20% more expensive
        },
        'Pacific Central': {
            description: 'Pacific Central Station is a major transportation hub. The station offers comprehensive services for all train types.',
            fuelPrice: 1.1 // 10% more expensive
        },
        'Kamloops': {
            description: 'Kamloops Station is a scenic stop in British Columbia. The station offers standard refueling and supply services.',
            fuelPrice: 1.15 // 15% more expensive
        },
        'Union': {
            description: 'Union Station is the final destination of your journey. The station offers premium services and maintenance facilities.',
            fuelPrice: 1.25 // 25% more expensive
        }
    };
    
    // Return default info if station not found
    return stationInfoMap[stationName] || {
        description: `Welcome to ${stationName} Station! This station offers standard refueling and supply services.`,
        fuelPrice: 1.0
    };
}

// Function to refuel the train
function refuelTrain() {
    // Animate refueling
    const startFuel = currentFuel;
    const fuelNeeded = MAX_FUEL - startFuel;
    
    if (fuelNeeded <= 0) {
        showNotification('Fuel tank is already full!');
        return;
    }
    
    showNotification('Refueling in progress...');
    
    // Animate the refueling over 3 seconds
    const refuelInterval = setInterval(() => {
        currentFuel += fuelNeeded / 30; // Increase by 1/30th of needed fuel each 100ms
        
        if (currentFuel >= MAX_FUEL) {
            currentFuel = MAX_FUEL;
            clearInterval(refuelInterval);
            showNotification('Refueling complete!');
            
            // Update fuel display
            const fuelDisplay = document.getElementById('fuel');
            if (fuelDisplay) {
                fuelDisplay.textContent = Math.round(currentFuel);
            }
            
            // Update fuel needle
            const fuelNeedle = document.getElementById('fuel-needle');
            if (fuelNeedle) {
                const fuelAngle = Math.min(270, (currentFuel / MAX_FUEL) * 270);
                fuelNeedle.style.transform = `rotate(${fuelAngle}deg)`;
                fuelNeedle.style.backgroundColor = '#00cc00'; // Reset to green
            }
        }
    }, 100);
}

// Function to stock up on supplies
function stockSupplies() {
    showNotification('Stocking up on supplies...');
    
    // Simulate loading supplies
    setTimeout(() => {
        showNotification('Supplies loaded! Your passengers will be comfortable for the journey.');
    }, 2000);
}

// Function to show notifications
function showNotification(message) {
    // Remove any existing notification
    const existingNotification = document.getElementById('train-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'train-notification';
    notification.className = 'train-notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Add this function to create a rear locomotive
function addRearLocomotive() {
    // Create rear locomotive element
    const rearLocomotive = document.createElement('div');
    rearLocomotive.id = 'rear-locomotive';
    rearLocomotive.className = 'carriage rear-locomotive';
    
    // Set initial position (behind the last carriage)
    const carriages = document.querySelectorAll('.carriage');
    const lastCarriageIndex = carriages.length - 1;
    
    if (lastCarriageIndex >= 0) {
        const lastCarriage = carriages[lastCarriageIndex];
        const lastCarriageLeft = parseInt(lastCarriage.style.left || '-420px');
        rearLocomotive.style.left = (lastCarriageLeft - 420) + 'px';
    } else {
        rearLocomotive.style.left = '-840px'; // Position if no carriages
    }
    
    // Add to viewport
    viewportElement.appendChild(rearLocomotive);
    
    // Apply appropriate styling based on selected train
    const selectedTrain = localStorage.getItem('selectedTrain');
    if (selectedTrain === 'rocky') {
        applyRockyMountaineerRearStyle(rearLocomotive);
    } else {
        applyVIARailRearStyle(rearLocomotive);
    }
}

// Function to apply VIA Rail styling to rear locomotive
function applyVIARailRearStyle(rearLocomotive) {
    rearLocomotive.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
        <!-- VIA Rail Rear Locomotive (Flipped) -->
        <defs>
            <linearGradient id="silverBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23f5f5f5"/>
                <stop offset="100%" style="stop-color:%23e0e0e0"/>
            </linearGradient>
            <linearGradient id="yellowStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23ffdd00"/>
                <stop offset="100%" style="stop-color:%23ffb700"/>
            </linearGradient>
            <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111a2f"/>
                <stop offset="100%" style="stop-color:%23203060"/>
            </linearGradient>
            <linearGradient id="darkFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111"/>
                <stop offset="100%" style="stop-color:%23000"/>
            </linearGradient>
        </defs>
        <!-- Main Body (Silver) -->
        <rect x="80" y="10" width="320" height="75" fill="url(%23silverBody)"/>
        <!-- Black Middle Section -->
        <rect x="80" y="30" width="320" height="40" fill="%23111"/>
        <!-- Yellow Stripe at Top -->
        <rect x="80" y="15" width="320" height="15" fill="url(%23yellowStripe)"/>
        <!-- More Triangular Front (Flipped) -->
        <path d="M80,10 L0,30 L0,85 L80,85 Z" fill="url(%23darkFront)"/>
        <!-- Front Window (smaller, flipped) -->
        <path d="M65,30 L20,40 L20,70 L65,70 Z" fill="url(%23windowGlass)"/>
        <!-- Windows -->
        <rect x="95" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="155" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="215" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="275" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="335" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <!-- VIA Logo -->
        <text x="280" y="55" font-family="Arial" font-size="22" fill="%23ffdd00" font-weight="bold">VIA</text>
        <!-- Wheels -->
        <circle cx="50" cy="90" r="8" fill="%23222"/>
        <circle cx="150" cy="90" r="8" fill="%23222"/>
        <circle cx="250" cy="90" r="8" fill="%23222"/>
        <circle cx="350" cy="90" r="8" fill="%23222"/>
    </svg>')`;
}

// Function to apply Rocky Mountaineer styling to rear locomotive
function applyRockyMountaineerRearStyle(rearLocomotive) {
    rearLocomotive.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
        <!-- Rocky Mountaineer Rear Locomotive (Flipped) -->
        <defs>
            <linearGradient id="rockyBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23003366"/>
                <stop offset="100%" style="stop-color:%23002244"/>
            </linearGradient>
            <linearGradient id="goldStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23FFD700"/>
                <stop offset="100%" style="stop-color:%23DAA520"/>
            </linearGradient>
            <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111a2f"/>
                <stop offset="100%" style="stop-color:%23203060"/>
            </linearGradient>
            <linearGradient id="darkFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111"/>
                <stop offset="100%" style="stop-color:%23000"/>
            </linearGradient>
        </defs>
        <!-- Main Body (Blue) -->
        <rect x="80" y="10" width="320" height="75" fill="url(%23rockyBody)"/>
        <!-- Gold Stripe at Middle -->
        <rect x="80" y="45" width="320" height="10" fill="url(%23goldStripe)"/>
        <!-- Triangular Front (Flipped) -->
        <path d="M80,10 L0,30 L0,85 L80,85 Z" fill="url(%23darkFront)"/>
        <!-- Front Window (Flipped) -->
        <path d="M65,30 L20,40 L20,70 L65,70 Z" fill="url(%23windowGlass)"/>
        <!-- Windows -->
        <rect x="95" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="155" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="215" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="275" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="335" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <!-- RM Logo -->
        <text x="280" y="65" font-family="Arial" font-size="18" fill="%23FFD700" font-weight="bold">RM</text>
        <!-- Wheels -->
        <circle cx="50" cy="90" r="8" fill="%23222"/>
        <circle cx="150" cy="90" r="8" fill="%23222"/>
        <circle cx="250" cy="90" r="8" fill="%23222"/>
        <circle cx="350" cy="90" r="8" fill="%23222"/>
    </svg>')`;
}

// Add this at the beginning of your JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a selected train type in localStorage
    const selectedTrain = localStorage.getItem('selectedTrain');
    
    if (selectedTrain === 'rocky') {
        // Apply Rocky Mountaineer styling
        applyRockyMountaineerStyle();
    }
    
    // Initialize the simulator
    initializeSimulation();
});

// Function to apply Rocky Mountaineer styling
function applyRockyMountaineerStyle() {
    const trainElement = document.getElementById('train');
    const carriageElements = document.querySelectorAll('.carriage');
    
    // Rocky Mountaineer style for locomotive
    trainElement.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
        <!-- Rocky Mountaineer Train -->
        <defs>
            <linearGradient id="rockyBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23003366"/>
                <stop offset="100%" style="stop-color:%23002244"/>
            </linearGradient>
            <linearGradient id="goldStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23FFD700"/>
                <stop offset="100%" style="stop-color:%23DAA520"/>
            </linearGradient>
            <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111a2f"/>
                <stop offset="100%" style="stop-color:%23203060"/>
            </linearGradient>
            <linearGradient id="darkFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111"/>
                <stop offset="100%" style="stop-color:%23000"/>
            </linearGradient>
        </defs>
        <!-- Main Body (Blue) -->
        <rect x="0" y="10" width="320" height="75" fill="url(%23rockyBody)"/>
        <!-- Gold Stripe at Middle -->
        <rect x="0" y="45" width="320" height="10" fill="url(%23goldStripe)"/>
        <!-- Triangular Front -->
        <path d="M320,10 L400,30 L400,85 L320,85 Z" fill="url(%23darkFront)"/>
        <!-- Front Window -->
        <path d="M335,30 L380,40 L380,70 L335,70 Z" fill="url(%23windowGlass)"/>
        <!-- Windows -->
        <rect x="20" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="80" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="140" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="200" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="260" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <!-- RM Logo -->
        <text x="120" y="65" font-family="Arial" font-size="18" fill="%23FFD700" font-weight="bold">RM</text>
        <!-- Wheels -->
        <circle cx="50" cy="90" r="8" fill="%23222"/>
        <circle cx="150" cy="90" r="8" fill="%23222"/>
        <circle cx="250" cy="90" r="8" fill="%23222"/>
        <circle cx="350" cy="90" r="8" fill="%23222"/>
    </svg>')`;
    
    // Rocky Mountaineer style for carriages
    carriageElements.forEach(carriage => {
        carriage.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
            <!-- Rocky Mountaineer Carriage -->
            <defs>
                <linearGradient id="rockyBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:%23003366"/>
                    <stop offset="100%" style="stop-color:%23002244"/>
                </linearGradient>
                <linearGradient id="goldStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:%23FFD700"/>
                    <stop offset="100%" style="stop-color:%23DAA520"/>
                </linearGradient>
                <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:%23111a2f"/>
                    <stop offset="100%" style="stop-color:%23203060"/>
                </linearGradient>
            </defs>
            <!-- Main Body (Blue) -->
            <rect x="0" y="10" width="400" height="75" fill="url(%23rockyBody)"/>
            <!-- Gold Stripe at Middle -->
            <rect x="0" y="45" width="400" height="10" fill="url(%23goldStripe)"/>
            <!-- Connector Ends -->
            <circle cx="0" cy="50" r="8" fill="%23222"/>
            <circle cx="400" cy="50" r="8" fill="%23222"/>
            <!-- Windows -->
            <rect x="30" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="95" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="160" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="225" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="290" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <!-- Undercarriage -->
            <rect x="0" y="85" width="400" height="15" fill="%23333"/>
            <!-- Wheels -->
            <circle cx="50" cy="90" r="8" fill="%23222"/>
            <circle cx="150" cy="90" r="8" fill="%23222"/>
            <circle cx="250" cy="90" r="8" fill="%23222"/>
            <circle cx="350" cy="90" r="8" fill="%23222"/>
        </svg>')`;
    });
}

// Add this to your initialization function
function initializeTrack() {
    const simulatorContainer = document.querySelector('.simulator-container');
    
    // Create ballast element if it doesn't exist
    if (!document.getElementById('ballast')) {
        const ballastElement = document.createElement('div');
        ballastElement.id = 'ballast';
        simulatorContainer.appendChild(ballastElement);
    }
    
    // Make sure the track is above the ballast in the DOM
    const trackElement = document.getElementById('track');
    if (trackElement) {
        simulatorContainer.appendChild(trackElement); // Move to end to ensure it's on top
    }
}

// Call this function during your initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeTrack();
    // Your other initialization code...
}); 