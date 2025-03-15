// Find and remove all sound-related code

// 1. Remove any sound objects
if (typeof sounds !== 'undefined') {
    sounds = null;
}

// 2. Remove any background music references
if (typeof bgMusic !== 'undefined') {
    bgMusic = null;
}
if (typeof panicMusic !== 'undefined') {
    panicMusic = null;
}

// 3. Create empty sound functions to replace any existing ones
function playSound() {}
function stopSound() {}
function pauseSound() {}

// 4. Override the Audio constructor to prevent new sound loading
window.Audio = function() {
    return {
        play: function() {},
        pause: function() {},
        stop: function() {}
    };
};

document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameArea = document.querySelector('.game-area');
    const player = document.getElementById('player');
    const cutButton = document.getElementById('cut-button');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const gameOverScreen = document.getElementById('game-over');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('final-score');
    const sausageCountElement = document.getElementById('sausage-count');
    const remainingSausagesElement = document.getElementById('remaining-sausages');
    const timeLeftElement = document.getElementById('time-left');

    // Game variables
    let score = 0;
    let gameActive = false;
    let sausagePeople = [];
    let playerX = 0;
    let playerY = 0;
    let playerSpeed = 8;
    let keys = {};
    let closestSausagePerson = null;
    let totalSausagePeople = 500;
    let remainingSausagePeople = totalSausagePeople;
    let lastMoveX = 0;
    let lastMoveY = 0;
    let sausageMovementInterval;
    let panicMode = false;
    let gameTimeInSeconds = 120; // 2 minutes
    let timeLeft = gameTimeInSeconds;
    let timerInterval;
    let canCut = true;
    let spaceHeld = false;
    let cutInterval;
    let powerUps = {
        chainsaw: false,
        multiCut: false,
        speedBoost: false,
        timeFreeze: false
    };
    let comboCount = 0;
    let comboTimer = null;
    let gameMode = 'classic'; // classic, frenzy, boss, survival
    let bossSpawned = false;
    let difficultyMultiplier = 1;
    let frenzyMultiplier = 1;
    let frenzyComboTimer = null;
    let rainbowIntensity = 0;
    let selectedMode = 'classic';
    let activeComboMessages = [];
    let bossHealth = 100;
    let bossPhase = 1;
    let lastBossAttack = 0;
    let bossAttackInterval = 3000; // 3 seconds between attacks
    let waveNumber = 1;
    let specialTypes = {
        ninja: { speed: 2, color: '#000' },
        explosive: { radius: 100, color: '#f00' },
        tank: { health: 5, color: '#080' },
        teleporter: { blinkCooldown: 2000, color: '#60f' },
        splitter: { splits: 2, color: '#f90' }
    };

    // Game area dimensions
    const gameAreaRect = gameArea.getBoundingClientRect();
    const gameAreaWidth = gameAreaRect.width;
    const gameAreaHeight = gameAreaRect.height;
    
    // Safe zone margins to keep sausages visible
    const safeMargin = 20;

    // Initialize player position
    playerX = gameAreaWidth / 2 - player.offsetWidth / 2;
    playerY = gameAreaHeight / 2 - player.offsetHeight / 2;
    updatePlayerPosition();

    // Start game function
    function startGame() {
        // Reset all game variables
        gameActive = true;
        score = 0;
        remainingSausagePeople = totalSausagePeople;
        panicMode = false;
        timeLeft = gameTimeInSeconds;
        
        // Update UI
        scoreElement.textContent = score;
        sausageCountElement.textContent = remainingSausagePeople;
        updateTimeDisplay();
        
        // Remove any existing classes
        document.body.classList.remove('panic-mode');
        const gameAreaElement = document.querySelector('.game-area');
        gameAreaElement.classList.remove('extreme-panic');
        
        // Clear existing sausage people
        clearSausagePeople();
        
        // Set up game based on mode
        switch(gameMode) {
            case 'frenzy':
                // SUPER SPEED EVERYTHING
                playerSpeed = 16;
                gameTimeInSeconds = 60;
                totalSausagePeople = 1000;
                difficultyMultiplier = 2;
                frenzyMultiplier = 1;
                document.body.classList.add('rainbow-mode');
                // Start the frenzy effects
                startFrenzyEffects();
                break;
            
            case 'boss':
                // Boss battle setup
                playerSpeed = 10;
                gameTimeInSeconds = 180; // 3 minutes to defeat the boss
                totalSausagePeople = 1; // Just the boss
                remainingSausagePeople = 1;
                bossHealth = 100;
                bossPhase = 1;
                spawnBossSausage();
                break;
            
            case 'survival':
                // Endless waves of chaos
                totalSausagePeople = 200;  // Start with 200 sausages
                gameTimeInSeconds = Infinity;
                difficultyMultiplier = 1;
                waveNumber = 1;
                document.body.classList.add('survival-mode');
                
                // Generate initial wave with 50 explosive sausages
                for (let i = 0; i < 150; i++) {  // 150 normal sausages
                    createSausagePerson();
                }
                for (let i = 0; i < 50; i++) {   // 50 explosive sausages
                    createSpecialSausage('explosive');
                }
                
                startWaveSystem();
                break;
            
            default: // classic mode
                playerSpeed = 8;
                gameTimeInSeconds = 120;
                totalSausagePeople = 500;
                difficultyMultiplier = 1;
                document.body.classList.remove('rainbow-mode');
        }
        
        // Generate new sausage people
        generateSausagePeople();
        
        // Hide game over screen
        gameOverScreen.classList.add('hidden');
        
        // Enable reset button
        resetBtn.disabled = false;
        startBtn.disabled = true;
        
        // Start sausage movement
        startSausageMovement();
        
        // Start timer
        startTimer();
        
        // Start game loop
        requestAnimationFrame(gameLoop);

        // Add power-ups
        setInterval(spawnPowerUp, 10000); // Spawn every 10 seconds
    }

    // Start timer function
    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerInterval = setInterval(() => {
            if (gameActive) {
                timeLeft--;
                updateTimeDisplay();
                
                if (timeLeft <= 0) {
                    // Time's up!
                    endGame(false);
                }
            }
        }, 1000);
    }
    
    // Update time display
    function updateTimeDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeLeftElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    // Generate sausage people
    function generateSausagePeople() {
        for (let i = 0; i < totalSausagePeople; i++) {
            createSausagePerson();
        }
    }

    // Create a single sausage person
    function createSausagePerson() {
        const sausageMan = document.createElement('div');
        sausageMan.className = 'sausage-man';
        
        const head = document.createElement('div');
        head.className = 'head';
        
        const body = document.createElement('div');
        body.className = 'body';
        
        const legs = document.createElement('div');
        legs.className = 'legs';
        
        const leftLeg = document.createElement('div');
        leftLeg.className = 'leg left-leg';
        leftLeg.dataset.leg = 'left';
        
        const rightLeg = document.createElement('div');
        rightLeg.className = 'leg right-leg';
        rightLeg.dataset.leg = 'right';
        
        legs.appendChild(leftLeg);
        legs.appendChild(rightLeg);
        
        sausageMan.appendChild(head);
        sausageMan.appendChild(body);
        sausageMan.appendChild(legs);
        
        // Position randomly in game area, but keep within safe margins
        const maxX = gameAreaWidth - sausageMan.offsetWidth - safeMargin;
        const maxY = gameAreaHeight - sausageMan.offsetHeight - safeMargin;
        
        // Ensure they're not too close to the player at start and stay within safe margins
        let sausageX, sausageY;
        do {
            sausageX = Math.random() * (maxX - safeMargin) + safeMargin;
            sausageY = Math.random() * (maxY - safeMargin) + safeMargin;
        } while (
            Math.abs(sausageX - playerX) < 100 && 
            Math.abs(sausageY - playerY) < 100
        );
        
        sausageMan.style.left = `${sausageX}px`;
        sausageMan.style.top = `${sausageY}px`;
        
        // Add to game area
        gameArea.appendChild(sausageMan);
        
        // All sausages are walking from the start
        const speedX = (Math.random() - 0.5) * 2;
        const speedY = (Math.random() - 0.5) * 2;
        
        // Create sausage object
        const sausage = {
            element: sausageMan,
            x: sausageX,
            y: sausageY,
            isDead: false,
            speedX: speedX,
            speedY: speedY,
            runningAway: false,
            legAnimationFrame: 0,
            isWalking: true  // All sausages are walking from the start
        };
        
        // Add to sausage people array
        sausagePeople.push(sausage);
        
        // Return the sausage object
        return sausage;
    }

    // Clear all sausage people
    function clearSausagePeople() {
        sausagePeople.forEach(sausage => {
            if (sausage.element.parentNode) {
                sausage.element.parentNode.removeChild(sausage.element);
            }
        });
        sausagePeople = [];
    }

    // Start sausage movement
    function startSausageMovement() {
        if (sausageMovementInterval) {
            clearInterval(sausageMovementInterval);
        }
        
        sausageMovementInterval = setInterval(() => {
            if (gameActive) {
                moveSausagePeople();
            }
        }, 50);
    }

    // Move all sausage people
    function moveSausagePeople() {
        // Use safe margins to keep sausages visible
        const maxX = gameAreaWidth - 40 - safeMargin; // sausage width
        const maxY = gameAreaHeight - 100 - safeMargin; // sausage height
        const minX = safeMargin;
        const minY = safeMargin;
        
        sausagePeople.forEach(sausage => {
            if (!sausage.isDead) {
                // Check if player is close and sausage should run away
                const dx = (playerX + player.offsetWidth / 2) - (sausage.x + sausage.element.offsetWidth / 2);
                const dy = (playerY + player.offsetHeight / 2) - (sausage.y + sausage.element.offsetHeight / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If player is close, run away!
                if (distance < 150) {
                    sausage.runningAway = true;
                    
                    // Run away from player - as fast as player in panic mode!
                    const angle = Math.atan2(dy, dx);
                    const runSpeed = panicMode ? playerSpeed : 2.5; // Same speed as player in panic mode
                    sausage.speedX = -Math.cos(angle) * runSpeed;
                    sausage.speedY = -Math.sin(angle) * runSpeed;
                    
                    // Add panic class for running animation
                    sausage.element.classList.add('panic');
                } else {
                    // If not running away, move randomly
                    if (!sausage.runningAway) {
                        // Occasionally change direction
                        if (Math.random() < 0.02) {
                            sausage.speedX = (Math.random() - 0.5) * 2;
                            sausage.speedY = (Math.random() - 0.5) * 2;
                        }
                    } else {
                        // Gradually slow down if no longer being chased
                        sausage.speedX *= 0.95;
                        sausage.speedY *= 0.95;
                        
                        // Stop running if speed is very low
                        if (Math.abs(sausage.speedX) < 0.1 && Math.abs(sausage.speedY) < 0.1) {
                            sausage.runningAway = false;
                            sausage.element.classList.remove('panic');
                        }
                    }
                }
                
                // Update position
                sausage.x += sausage.speedX;
                sausage.y += sausage.speedY;
                
                // Keep within bounds with safe margins
                if (sausage.x < minX) {
                    sausage.x = minX;
                    sausage.speedX *= -1;
                }
                if (sausage.x > maxX) {
                    sausage.x = maxX;
                    sausage.speedX *= -1;
                }
                if (sausage.y < minY) {
                    sausage.y = minY;
                    sausage.speedY *= -1;
                }
                if (sausage.y > maxY) {
                    sausage.y = maxY;
                    sausage.speedY *= -1;
                }
                
                // Update position in DOM
                sausage.element.style.left = `${sausage.x}px`;
                sausage.element.style.top = `${sausage.y}px`;
                
                // Flip sausage based on movement direction
                if (sausage.speedX > 0.1) {
                    sausage.element.style.transform = 'scaleX(-1)';
                } else if (sausage.speedX < -0.1) {
                    sausage.element.style.transform = 'scaleX(1)';
                }
                
                // Animate legs for walking/running
                sausage.legAnimationFrame = (sausage.legAnimationFrame + 1) % 6;
                const leftLeg = sausage.element.querySelector('.left-leg');
                const rightLeg = sausage.element.querySelector('.right-leg');
                
                if (sausage.legAnimationFrame < 3) {
                    const intensity = sausage.runningAway ? 20 : 10;
                    leftLeg.style.transform = `rotate(${intensity}deg)`;
                    rightLeg.style.transform = `rotate(-${intensity}deg)`;
                } else {
                    const intensity = sausage.runningAway ? 20 : 10;
                    leftLeg.style.transform = `rotate(-${intensity}deg)`;
                    rightLeg.style.transform = `rotate(${intensity}deg)`;
                }
            }
        });
        
        // Make panic mode start when there are 400 sausages left (100 killed)
        if (!panicMode && remainingSausagePeople <= 400) {
            panicMode = true;
            document.body.classList.add('panic-mode');
            
            // Add panic message
            const panicMessage = document.createElement('div');
            panicMessage.className = 'panic-message';
            panicMessage.textContent = 'APOCALYPSE MODE ACTIVATED!!!';
            document.body.appendChild(panicMessage);
            
            // Add more panic effects
            const gameArea = document.querySelector('.game-area');
            gameArea.classList.add('extreme-panic');
            
            setTimeout(() => {
                if (panicMessage.parentNode) {
                    panicMessage.remove();
                }
            }, 3000);
        }
    }

    // Update player position
    function updatePlayerPosition() {
        player.style.left = `${playerX}px`;
        player.style.top = `${playerY}px`;
        
        // Rotate knife hand based on movement direction
        const knifeHand = player.querySelector('.knife-hand');
        
        // If player is moving, rotate knife in that direction
        if (lastMoveX !== 0 || lastMoveY !== 0) {
            const angle = Math.atan2(lastMoveY, lastMoveX) * (180 / Math.PI);
            knifeHand.style.transform = `rotate(${angle}deg)`;
        }
    }

    // Move player based on key presses
    function movePlayer() {
        let moveX = 0;
        let moveY = 0;
        
        // WASD or Arrow keys
        if (keys['ArrowUp'] || keys['w'] || keys['W']) moveY -= playerSpeed;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) moveY += playerSpeed;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) moveX -= playerSpeed;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) moveX += playerSpeed;
        
        // Update position
        playerX += moveX;
        playerY += moveY;
        
        // Keep player within game area
        if (playerX < 0) playerX = 0;
        if (playerX > gameAreaWidth - player.offsetWidth) playerX = gameAreaWidth - player.offsetWidth;
        if (playerY < 0) playerY = 0;
        if (playerY > gameAreaHeight - player.offsetHeight) playerY = gameAreaHeight - player.offsetHeight;
        
        // Store last movement direction if player is moving
        if (moveX !== 0 || moveY !== 0) {
            lastMoveX = moveX;
            lastMoveY = moveY;
        }
        
        updatePlayerPosition();
    }

    // Check for proximity to sausage people
    function checkProximity() {
        const cutRange = 70; // Distance within which player can cut legs
        let minDistance = cutRange + 1;
        closestSausagePerson = null;
        
        sausagePeople.forEach(sausage => {
            if (!sausage.isDead) {
                const dx = (playerX + player.offsetWidth / 2) - (sausage.x + sausage.element.offsetWidth / 2);
                const dy = (playerY + player.offsetHeight / 2) - (sausage.y + sausage.element.offsetHeight / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < cutRange && distance < minDistance) {
                    minDistance = distance;
                    closestSausagePerson = sausage;
                }
            }
        });
        
        if (closestSausagePerson) {
            cutButton.classList.remove('hidden');
            // Position the cut button above the closest sausage person
            cutButton.style.left = `${closestSausagePerson.x + closestSausagePerson.element.offsetWidth / 2 - cutButton.offsetWidth / 2}px`;
            cutButton.style.top = `${closestSausagePerson.y - cutButton.offsetHeight - 10}px`;
            
            // Auto-cut if space is held down
            if (spaceHeld && canCut) {
                cutLegs();
                canCut = false;
                setTimeout(() => {
                    canCut = true;
                }, 200); // Small cooldown to prevent too rapid cutting
            }
        } else {
            cutButton.classList.add('hidden');
        }
    }

    // Cut the legs of the closest sausage person
    function cutLegs() {
        if (closestSausagePerson && !closestSausagePerson.isDead) {
            if (closestSausagePerson.isBoss) {
                bossHealth -= 1;
                const healthFill = closestSausagePerson.element.querySelector('.health-fill');
                const healthText = closestSausagePerson.element.querySelector('.health-text');
                healthFill.style.width = `${bossHealth}%`;
                healthText.textContent = `${bossHealth}/100`;
                
                // Visual feedback
                closestSausagePerson.element.classList.add('boss-hit');
                setTimeout(() => {
                    closestSausagePerson.element.classList.remove('boss-hit');
                }, 200);
                
                if (bossHealth <= 0) {
                    bossDeath();
                }
                
                score += 10;
                scoreElement.textContent = score;
            } else {
                comboCount++;
                clearTimeout(comboTimer);
                
                // Show combo message
                createComboMessage(comboCount);
                
                // Reset combo after 2 seconds
                comboTimer = setTimeout(() => {
                    comboCount = 0;
                }, 2000);
                
                // Animate the knife cutting
                const knifeHand = player.querySelector('.knife-hand');
                knifeHand.classList.add('cutting');
                
                // Remove the cutting class after animation completes
                setTimeout(() => {
                    knifeHand.classList.remove('cutting');
                }, 300);
                
                const leftLeg = closestSausagePerson.element.querySelector('.left-leg');
                const rightLeg = closestSausagePerson.element.querySelector('.right-leg');
                
                // Get positions for the detached legs
                const leftLegRect = leftLeg.getBoundingClientRect();
                const rightLegRect = rightLeg.getBoundingClientRect();
                const gameAreaRect = gameArea.getBoundingClientRect();
                
                // Create blood splatter effects
                createBloodSplatter(leftLegRect.left - gameAreaRect.left, leftLegRect.top - gameAreaRect.top);
                createBloodSplatter(rightLegRect.left - gameAreaRect.left, rightLegRect.top - gameAreaRect.top);
                
                // Create detached left leg
                const detachedLeftLeg = document.createElement('div');
                detachedLeftLeg.className = 'detached-leg';
                detachedLeftLeg.style.left = `${leftLegRect.left - gameAreaRect.left}px`;
                detachedLeftLeg.style.top = `${leftLegRect.top - gameAreaRect.top + 10}px`;
                gameArea.appendChild(detachedLeftLeg);
                
                // Create detached right leg
                const detachedRightLeg = document.createElement('div');
                detachedRightLeg.className = 'detached-leg';
                detachedRightLeg.style.left = `${rightLegRect.left - gameAreaRect.left}px`;
                detachedRightLeg.style.top = `${rightLegRect.top - gameAreaRect.top + 10}px`;
                gameArea.appendChild(detachedRightLeg);
                
                // Add cut class to original legs
                leftLeg.classList.add('cut');
                rightLeg.classList.add('cut');
                
                // Mark sausage person as dead and stop movement
                closestSausagePerson.element.classList.add('dead');
                closestSausagePerson.isDead = true;
                closestSausagePerson.speedX = 0;
                closestSausagePerson.speedY = 0;
                closestSausagePerson.isWalking = false;
                closestSausagePerson.runningAway = false;
                
                // Add scream effect
                createScream(closestSausagePerson.x, closestSausagePerson.y);
                
                // Update score and count
                scoreElement.textContent = score;
                
                remainingSausagePeople--;
                sausageCountElement.textContent = remainingSausagePeople;
                
                cutButton.classList.add('hidden');
                
                // Remove detached legs after animation completes
                setTimeout(() => {
                    if (detachedLeftLeg.parentNode) {
                        detachedLeftLeg.parentNode.removeChild(detachedLeftLeg);
                    }
                    if (detachedRightLeg.parentNode) {
                        detachedRightLeg.parentNode.removeChild(detachedRightLeg);
                    }
                }, 1000);
                
                // Check if all sausage people are dead
                if (remainingSausagePeople <= 0) {
                    endGame(true);
                }

                if (gameMode === 'frenzy') {
                    // Extra effects for frenzy mode
                    createExplosiveEffect();
                    score += Math.floor(20 * frenzyMultiplier); // Double points
                    
                    // Chain reaction chance
                    if (Math.random() < 0.2) { // 20% chance
                        const nearbySausages = sausagePeople.filter(s => {
                            if (s.isDead) return false;
                            const dx = s.x - closestSausagePerson.x;
                            const dy = s.y - closestSausagePerson.y;
                            return Math.sqrt(dx * dx + dy * dy) < 100;
                        }).slice(0, 5); // Limit to 5 nearby sausages
                        
                        // Kill nearby sausages with delay
                        nearbySausages.forEach((s, i) => {
                            setTimeout(() => {
                                if (!s.isDead) {
                                    s.element.classList.add('chain-death');
                                    s.isDead = true;
                                    s.speedX = 0;
                                    s.speedY = 0;
                                    remainingSausagePeople--;
                                    sausageCountElement.textContent = remainingSausagePeople;
                                    score += 5; // Bonus points for chain kills
                                    scoreElement.textContent = score;
                                }
                            }, i * 100);
                        });
                    }
                }
            }
        }
    }

    // Create blood splatter effect
    function createBloodSplatter(x, y) {
        const splatter = document.createElement('div');
        splatter.className = 'blood-splatter';
        splatter.style.left = `${x}px`;
        splatter.style.top = `${y}px`;
        gameArea.appendChild(splatter);
        
        // Remove splatter after animation completes
        setTimeout(() => {
            if (splatter.parentNode) {
                splatter.parentNode.removeChild(splatter);
            }
        }, 500);
    }
    
    // Create scream effect
    function createScream(x, y) {
        const scream = document.createElement('div');
        scream.className = 'scream';
        
        // Array of possible screams
        const screams = [
            'AAAH!', 
            'HELP!', 
            'MY LEGS!', 
            'WHY?!', 
            'NOOO!', 
            'OUCH!', 
            'MOMMY!',
            'OH GOD!',
            'SAVE ME!',
            'RUN!',
            'NOT MY LEGS!',
            'I NEED THOSE!',
            'MEDIC!',
            'PLEASE NO!',
            'MERCY!'
        ];
        
        // Pick a random scream
        scream.textContent = screams[Math.floor(Math.random() * screams.length)];
        
        scream.style.left = `${x}px`;
        scream.style.top = `${y - 30}px`;
        gameArea.appendChild(scream);
        
        // Remove scream after animation completes
        setTimeout(() => {
            if (scream.parentNode) {
                scream.parentNode.removeChild(scream);
            }
        }, 1000);
    }

    // Game loop
    function gameLoop() {
        if (gameActive) {
            movePlayer();
            checkProximity();
            requestAnimationFrame(gameLoop);
        }
    }

    // End game function
    function endGame(victory) {
        gameActive = false;
        finalScoreElement.textContent = score;
        remainingSausagesElement.textContent = remainingSausagePeople;
        
        // Show victory or defeat message
        const gameOverTitle = document.querySelector('#game-over h2');
        if (victory) {
            gameOverTitle.textContent = "VICTORY!";
            gameOverTitle.style.color = "#4caf50";
        } else {
            gameOverTitle.textContent = "TIME'S UP!";
            gameOverTitle.style.color = "#ff0000";
        }
        
        gameOverScreen.classList.remove('hidden');
        
        resetBtn.disabled = true;
        startBtn.disabled = false;
        
        // Clear all intervals
        if (sausageMovementInterval) {
            clearInterval(sausageMovementInterval);
            sausageMovementInterval = null;
        }
        
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        if (cutInterval) {
            clearInterval(cutInterval);
            cutInterval = null;
        }
        
        // Remove panic mode
        document.body.classList.remove('panic-mode');
        const gameAreaElement = document.querySelector('.game-area');
        if (gameAreaElement.classList.contains('extreme-panic')) {
            gameAreaElement.classList.remove('extreme-panic');
        }
        
        // Remove any panic messages that might still be on screen
        const panicMessages = document.querySelectorAll('.panic-message');
        panicMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }

    // Reset game function - now properly resets everything
    function resetGame() {
        endGame(false);
        startBtn.disabled = false;
    }

    // Event listeners
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Space bar to cut legs
        if (e.key === ' ' && gameActive) {
            spaceHeld = true;
            if (closestSausagePerson && canCut) {
                cutLegs();
                canCut = false;
                setTimeout(() => {
                    canCut = true;
                }, 200);
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        
        if (e.key === ' ') {
            spaceHeld = false;
        }
    });
    
    cutButton.addEventListener('click', () => {
        if (gameActive && canCut) {
            cutLegs();
            canCut = false;
            setTimeout(() => {
                canCut = true;
            }, 200);
        }
    });
    
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', startGame);

    // Add function to create random power-ups
    function spawnPowerUp() {
        const types = ['chainsaw', 'multiCut', 'speedBoost', 'timeFreeze'];
        const powerUp = document.createElement('div');
        powerUp.className = 'power-up';
        powerUp.dataset.type = types[Math.floor(Math.random() * types.length)];
        
        // Random position
        powerUp.style.left = `${Math.random() * (gameAreaWidth - 50)}px`;
        powerUp.style.top = `${Math.random() * (gameAreaHeight - 50)}px`;
        
        gameArea.appendChild(powerUp);
    }

    // Add after sausage creation code
    function createSausageBoss() {
        const boss = createSausagePerson(); // Use existing function as base
        boss.element.classList.add('sausage-boss');
        boss.health = 100;
        boss.isBoss = true;
        
        // Boss abilities
        setInterval(() => {
            if (boss.isDead) return;
            // Shoot mustard projectiles
            const projectile = document.createElement('div');
            projectile.className = 'mustard-projectile';
            projectile.style.left = boss.x + 'px';
            projectile.style.top = boss.y + 'px';
            gameArea.appendChild(projectile);
        }, 2000);
    }

    function createSpecialSausage(type) {
        // Create a sausage person first
        const sausage = createSausagePerson();
        
        // Make sure sausage was created successfully
        if (!sausage || !sausage.element) {
            console.error("Failed to create special sausage:", type);
            return null;
        }
        
        // Add special type class
        sausage.element.classList.add(`${type}-sausage`);
        sausage.special = type;
        
        // Apply special properties based on type
        const specs = specialTypes[type] || {};
        
        switch(type) {
            case 'ninja':
                sausage.speedX = (sausage.speedX || 0) * (specs.speed || 2);
                sausage.speedY = (sausage.speedY || 0) * (specs.speed || 2);
                break;
            
            case 'tank':
                sausage.health = specs.health || 5;
                sausage.element.style.transform = 'scale(1.5)';
                break;
            
            case 'teleporter':
                setInterval(() => {
                    if (sausage && !sausage.isDead) {
                        teleportSausage(sausage);
                    }
                }, (specs.blinkCooldown || 2000));
                break;
            
            case 'splitter':
                sausage.onDeath = () => {
                    for (let i = 0; i < (specs.splits || 2); i++) {
                        const mini = createSausagePerson();
                        if (mini) {
                            mini.element.style.transform = 'scale(0.7)';
                            mini.x = sausage.x;
                            mini.y = sausage.y;
                        }
                    }
                };
                break;
            
            case 'explosive':
                sausage.onDeath = () => {
                    // Create explosion effect
                    createExplosion(sausage.x, sausage.y);
                    
                    // Find nearby sausages
                    const nearbySausages = sausagePeople.filter(s => {
                        if (s.isDead || s === sausage) return false;
                        const dx = s.x - sausage.x;
                        const dy = s.y - sausage.y;
                        return Math.sqrt(dx*dx + dy*dy) < 100;
                    });
                    
                    // Kill them with a delay for chain reaction effect
                    nearbySausages.forEach((s, i) => {
                        setTimeout(() => {
                            if (!s.isDead) {
                                s.isDead = true;
                                s.element.classList.add('dead');
                                remainingSausagePeople--;
                                sausageCountElement.textContent = remainingSausagePeople;
                                score += 5;
                                scoreElement.textContent = score;
                            }
                        }, i * 100);
                    });
                };
                break;
        }
        
        return sausage;
    }

    // Helper function to create explosion effect
    function createExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${x}px`;
        explosion.style.top = `${y}px`;
        gameArea.appendChild(explosion);
        
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.remove();
            }
        }, 1000);
    }

    function teleportSausage(sausage) {
        sausage.element.classList.add('teleporting');
        
        setTimeout(() => {
            // Random new position
            sausage.x = Math.random() * (gameAreaWidth - 50);
            sausage.y = Math.random() * (gameAreaHeight - 100);
            sausage.element.style.left = `${sausage.x}px`;
            sausage.element.style.top = `${sausage.y}px`;
            
            sausage.element.classList.remove('teleporting');
        }, 200);
    }

    // Add wave system for survival mode
    function startWaveSystem() {
        const waveInterval = setInterval(() => {
            if (!gameActive) {
                clearInterval(waveInterval);
                return;
            }
            
            // Epic wave announcement
            announceWave(waveNumber);
            
            // Calculate wave difficulty
            const baseCount = 30 + (waveNumber * 5);
            difficultyMultiplier = 1 + (waveNumber * 0.1);
            
            // Special waves
            if (waveNumber % 10 === 0) {
                // Boss wave every 10th wave
                spawnWaveBoss();
            } else if (waveNumber % 5 === 0) {
                // Special sausage wave every 5th wave
                spawnSpecialWave(baseCount);
            } else {
                // Normal wave with some special sausages mixed in
                spawnMixedWave(baseCount);
            }
            
            waveNumber++;
        }, 45000); // 45 seconds per wave
    }

    function announceWave(number) {
        const msg = document.createElement('div');
        msg.className = 'wave-message';
        
        let waveText = `WAVE ${number}`;
        let waveClass = 'normal-wave';
        
        if (number % 10 === 0) {
            waveText = `🔥 BOSS WAVE ${number} 🔥`;
            waveClass = 'boss-wave';
        } else if (number % 5 === 0) {
            waveText = `⚡ SPECIAL WAVE ${number} ⚡`;
            waveClass = 'special-wave';
        }
        
        msg.textContent = waveText;
        msg.classList.add(waveClass);
        gameArea.appendChild(msg);
        
        // Wave effects
        createWaveEffects(waveClass);
        
        setTimeout(() => msg.remove(), 3000);
    }

    function createWaveEffects(waveClass) {
        // Screen shake
        gameArea.classList.add('screen-shake');
        setTimeout(() => gameArea.classList.remove('screen-shake'), 1000);
        
        // Particle effects
        for (let i = 0; i < 20; i++) {
            createParticle(waveClass);
        }
    }

    function spawnMixedWave(count) {
        // 25% of new sausages should be explosive
        const explosiveCount = Math.floor(count * 0.25);
        const normalCount = count - explosiveCount;
        
        // Add normal sausages
        for (let i = 0; i < normalCount; i++) {
            createSausagePerson();
        }
        
        // Add explosive sausages
        for (let i = 0; i < explosiveCount; i++) {
            createSpecialSausage('explosive');
        }
        
        // Update counts
        totalSausagePeople += count;
        remainingSausagePeople += count;
        sausageCountElement.textContent = remainingSausagePeople;
    }

    function spawnWaveBoss() {
        const boss = createSausagePerson();
        boss.element.classList.add('sausage-boss');
        boss.health = 100;
        boss.isBoss = true;
        boss.element.style.transform = 'scale(3)';
        
        // Add health bar
        const healthBar = document.createElement('div');
        healthBar.className = 'boss-health';
        healthBar.innerHTML = '<div class="health-fill"></div>';
        boss.element.appendChild(healthBar);
        
        // Boss attacks
        const attackInterval = setInterval(() => {
            if (!gameActive || boss.isDead) {
                clearInterval(attackInterval);
                return;
            }
            
            // Random attack patterns
            const attacks = [
                () => shootMustard(boss),
                () => sausageRain(boss),
                () => groundPound(boss)
            ];
            
            const randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
            randomAttack();
        }, 3000);
        
        return boss;
    }

    // Boss attack patterns
    function shootMustard(boss) {
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const projectile = document.createElement('div');
            projectile.className = 'mustard-projectile';
            projectile.style.left = `${boss.x + boss.element.offsetWidth/2}px`;
            projectile.style.top = `${boss.y + boss.element.offsetHeight/2}px`;
            
            const speed = 5;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            
            gameArea.appendChild(projectile);
            
            const moveProjectile = setInterval(() => {
                if (!gameActive) {
                    clearInterval(moveProjectile);
                    projectile.remove();
                    return;
                }
                
                const currentLeft = parseFloat(projectile.style.left);
                const currentTop = parseFloat(projectile.style.top);
                
                projectile.style.left = `${currentLeft + velocityX}px`;
                projectile.style.top = `${currentTop + velocityY}px`;
                
                // Check collision with player
                if (checkCollision(projectile, player)) {
                    playerDamage();
                }
                
                // Remove if out of bounds
                if (currentLeft < 0 || currentLeft > gameAreaWidth || 
                    currentTop < 0 || currentTop > gameAreaHeight) {
                    clearInterval(moveProjectile);
                    projectile.remove();
                }
            }, 16);
        }
    }

    // Add new frenzy mode functions
    function startFrenzyEffects() {
        // Reset any existing effects
        document.body.style.setProperty('--rainbow-speed', '2s');
        frenzyMultiplier = 1;
        
        // Rainbow background intensity increases with score
        const rainbowInterval = setInterval(() => {
            if (!gameActive || gameMode !== 'frenzy') {
                clearInterval(rainbowInterval);
                document.body.style.setProperty('--rainbow-speed', '2s');
                return;
            }
            
            rainbowIntensity = Math.min(score / 1000, 1);
            document.body.style.setProperty('--rainbow-speed', `${2 - rainbowIntensity}s`);
        }, 100);

        // Spawn random ketchup pools
        const ketchupInterval = setInterval(() => {
            if (!gameActive || gameMode !== 'frenzy') {
                clearInterval(ketchupInterval);
                return;
            }
            
            // Limit number of ketchup pools
            const existingPools = document.querySelectorAll('.ketchup-pool');
            if (existingPools.length < 5) {
                createKetchupPool();
            }
        }, 3000);

        // Speed increases with score
        const speedInterval = setInterval(() => {
            if (!gameActive || gameMode !== 'frenzy') {
                clearInterval(speedInterval);
                return;
            }
            
            // Calculate new multiplier
            const newMultiplier = 1 + (score / 2000); // Max 2x speed at 2000 points
            
            // Only update if speed has actually changed
            if (newMultiplier !== frenzyMultiplier) {
                frenzyMultiplier = newMultiplier;
                
                // Reset and reapply speed to all sausages
                sausagePeople.forEach(sausage => {
                    if (!sausage.isDead) {
                        // Reset to base speed first
                        const baseSpeed = 2;
                        const angle = Math.atan2(sausage.speedY, sausage.speedX);
                        
                        // Apply new speed
                        sausage.speedX = Math.cos(angle) * baseSpeed * frenzyMultiplier;
                        sausage.speedY = Math.sin(angle) * baseSpeed * frenzyMultiplier;
                    }
                });
            }
        }, 1000);
    }

    function createKetchupPool() {
        const pool = document.createElement('div');
        pool.className = 'ketchup-pool';
        pool.style.width = `${Math.random() * 100 + 50}px`;
        pool.style.height = pool.style.width;
        
        // Ensure pool is within bounds
        const maxX = gameAreaWidth - parseInt(pool.style.width);
        const maxY = gameAreaHeight - parseInt(pool.style.width);
        pool.style.left = `${Math.random() * maxX}px`;
        pool.style.top = `${Math.random() * maxY}px`;
        
        gameArea.appendChild(pool);
        
        // Make sausages slip in ketchup
        const slipInterval = setInterval(() => {
            if (!gameActive) {
                clearInterval(slipInterval);
                return;
            }
            
            sausagePeople.forEach(sausage => {
                if (!sausage.isDead && checkCollision(pool, sausage.element)) {
                    if (!sausage.isSlipping) {
                        sausage.isSlipping = true;
                        sausage.element.classList.add('slipping');
                        
                        // Temporary speed boost
                        const currentSpeed = Math.sqrt(sausage.speedX * sausage.speedX + sausage.speedY * sausage.speedY);
                        const angle = Math.atan2(sausage.speedY, sausage.speedX);
                        sausage.speedX = Math.cos(angle) * currentSpeed * 1.5;
                        sausage.speedY = Math.sin(angle) * currentSpeed * 1.5;
                        
                        // Reset after leaving pool
                        setTimeout(() => {
                            if (!sausage.isDead) {
                                sausage.isSlipping = false;
                                sausage.element.classList.remove('slipping');
                                sausage.speedX /= 1.5;
                                sausage.speedY /= 1.5;
                            }
                        }, 500);
                    }
                }
            });
        }, 100);
        
        // Remove pool after some time
        setTimeout(() => {
            if (pool.parentNode) {
                pool.remove();
                clearInterval(slipInterval);
            }
        }, 5000);
    }

    function createExplosiveEffect() {
        const explosion = document.createElement('div');
        explosion.className = 'frenzy-explosion';
        explosion.style.left = `${closestSausagePerson.x}px`;
        explosion.style.top = `${closestSausagePerson.y}px`;
        gameArea.appendChild(explosion);
        
        setTimeout(() => explosion.remove(), 1000);
    }

    // Add event listeners for mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Set selected mode
            selectedMode = btn.dataset.mode;
            gameMode = selectedMode;
            
            // Update instructions based on mode
            updateModeInstructions(selectedMode);
        });
    });

    // Add function to update instructions
    function updateModeInstructions(mode) {
        const instructions = document.querySelector('.instructions');
        switch(mode) {
            case 'frenzy':
                instructions.innerHTML = `
                    <p>FRENZY MODE: Double speed, 1000 sausages, 60 seconds!</p>
                    <p><strong>Chain reactions will occur! Ketchup pools will appear!</strong></p>
                    <p><em>The more you kill, the faster everything gets!</em></p>
                `;
                break;
            case 'boss':
                instructions.innerHTML = `
                    <p>BOSS MODE: Fight giant sausage bosses!</p>
                    <p><strong>Dodge mustard attacks and defeat the mega-sausages!</strong></p>
                    <p><em>Each boss has special abilities!</em></p>
                `;
                break;
            case 'survival':
                instructions.innerHTML = `
                    <p>SURVIVAL MODE: Endless waves of sausages!</p>
                    <p><strong>Every wave brings more and tougher sausages!</strong></p>
                    <p><em>Special sausages appear every 5th wave!</em></p>
                `;
                break;
            default:
                instructions.innerHTML = `
                    <p>Use WASD or Arrow Keys to move. Get close to a sausage person and press Space or click "Cut Legs" to cut their legs.</p>
                    <p><strong>WARNING: 500 SAUSAGES WILL RUN FOR THEIR LIVES!!! You have 2 minutes to cut them all!</strong></p>
                    <p><em>Hold space to cut repeatedly!</em></p>
                `;
        }
    }

    // Modify the combo message creation in cutLegs function
    function createComboMessage(count) {
        const comboMsg = document.createElement('div');
        comboMsg.className = 'combo-message';
        comboMsg.textContent = `${count}x COMBO!`;
        if (count > 10) comboMsg.classList.add('mega-combo');
        gameArea.appendChild(comboMsg);
        
        // Add to active messages array
        activeComboMessages.push(comboMsg);
        
        // Remove after 1 second
        setTimeout(() => {
            if (comboMsg.parentNode) {
                comboMsg.remove();
                activeComboMessages = activeComboMessages.filter(msg => msg !== comboMsg);
            }
        }, 1000);
    }

    function spawnBossSausage() {
        const boss = document.createElement('div');
        boss.className = 'sausage-man boss-sausage';
        boss.innerHTML = `
            <div class="boss-health-bar">
                <div class="health-fill"></div>
                <span class="health-text">100/100</span>
            </div>
            <div class="head"></div>
            <div class="body"></div>
            <div class="legs">
                <div class="leg left-leg"></div>
                <div class="leg right-leg"></div>
            </div>
        `;
        
        // Position in center
        boss.style.left = `${gameAreaWidth/2 - 100}px`;
        boss.style.top = `${gameAreaHeight/2 - 150}px`;
        gameArea.appendChild(boss);
        
        // Add to sausage people array with special boss properties
        sausagePeople = [{
            element: boss,
            x: gameAreaWidth/2 - 100,
            y: gameAreaHeight/2 - 150,
            isDead: false,
            isBoss: true,
            speedX: 0,
            speedY: 0,
            lastAttack: Date.now()
        }];
        
        // Start boss AI
        startBossAI();
    }

    function startBossAI() {
        const bossAIInterval = setInterval(() => {
            if (!gameActive || bossHealth <= 0) {
                clearInterval(bossAIInterval);
                return;
            }
            
            const boss = sausagePeople[0];
            const now = Date.now();
            
            // Change attack patterns based on health
            if (now - lastBossAttack > bossAttackInterval) {
                lastBossAttack = now;
                
                if (bossHealth > 66) { // Phase 1
                    bossGroundPound();
                } else if (bossHealth > 33) { // Phase 2
                    bossPhase = 2;
                    bossAttackInterval = 2500; // Faster attacks
                    bossMustardSpray();
                } else { // Phase 3
                    bossPhase = 3;
                    bossAttackInterval = 2000; // Even faster
                    if (Math.random() < 0.5) {
                        bossGroundPound();
                    } else {
                        bossMustardSpray();
                    }
                }
            }
            
            // Move boss
            moveBoss(boss);
            
        }, 100);
    }

    function moveBoss(boss) {
        // Move towards player with increasing speed based on phase
        const dx = playerX - boss.x;
        const dy = playerY - boss.y;
        const angle = Math.atan2(dy, dx);
        const speed = 1 + (bossPhase * 0.5);
        
        boss.speedX = Math.cos(angle) * speed;
        boss.speedY = Math.sin(angle) * speed;
        
        boss.x += boss.speedX;
        boss.y += boss.speedY;
        
        // Update position
        boss.element.style.left = `${boss.x}px`;
        boss.element.style.top = `${boss.y}px`;
    }

    function bossGroundPound() {
        const boss = sausagePeople[0];
        boss.element.classList.add('ground-pound');
        
        // Create shockwave
        const shockwave = document.createElement('div');
        shockwave.className = 'shockwave';
        shockwave.style.left = `${boss.x}px`;
        shockwave.style.top = `${boss.y}px`;
        gameArea.appendChild(shockwave);
        
        // Check if player is caught in shockwave
        setTimeout(() => {
            const dx = playerX - boss.x;
            const dy = playerY - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                stunPlayer(1000); // Stun player for 1 second
            }
            
            shockwave.remove();
            boss.element.classList.remove('ground-pound');
        }, 1000);
    }

    function bossMustardSpray() {
        const boss = sausagePeople[0];
        boss.element.classList.add('mustard-attack');
        
        // Spray mustard in 8 directions
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            shootMustard(boss.x, boss.y, angle);
        }
        
        setTimeout(() => {
            boss.element.classList.remove('mustard-attack');
        }, 500);
    }

    function shootMustard(x, y, angle) {
        const mustard = document.createElement('div');
        mustard.className = 'mustard-projectile';
        mustard.style.left = `${x}px`;
        mustard.style.top = `${y}px`;
        gameArea.appendChild(mustard);
        
        const speed = 5;
        const mustardInterval = setInterval(() => {
            const currentX = parseFloat(mustard.style.left);
            const currentY = parseFloat(mustard.style.top);
            
            mustard.style.left = `${currentX + Math.cos(angle) * speed}px`;
            mustard.style.top = `${currentY + Math.sin(angle) * speed}px`;
            
            // Check player collision
            const dx = playerX - currentX;
            const dy = playerY - currentY;
            if (Math.sqrt(dx * dx + dy * dy) < 30) {
                stunPlayer(500); // Stun for 0.5 seconds
                mustard.remove();
                clearInterval(mustardInterval);
            }
            
            // Remove if out of bounds
            if (currentX < 0 || currentX > gameAreaWidth || 
                currentY < 0 || currentY > gameAreaHeight) {
                mustard.remove();
                clearInterval(mustardInterval);
            }
        }, 16);
    }

    function stunPlayer(duration) {
        player.classList.add('stunned');
        playerSpeed = 0;
        setTimeout(() => {
            player.classList.remove('stunned');
            playerSpeed = gameMode === 'boss' ? 10 : 8;
        }, duration);
    }

    function bossDeath() {
        const boss = sausagePeople[0];
        boss.isDead = true;
        boss.element.classList.add('boss-death');
        
        // Create massive explosion
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                createExplosion(
                    boss.x + Math.random() * 200 - 100,
                    boss.y + Math.random() * 200 - 100
                );
            }, i * 100);
        }
        
        setTimeout(() => {
            endGame(true);
        }, 2000);
    }

    function createParticle(type) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Different particle styles based on wave type
        if (type === 'boss-wave') {
            particle.classList.add('boss-particle');
        } else if (type === 'special-wave') {
            particle.classList.add('special-particle');
        }
        
        // Random position
        particle.style.left = `${Math.random() * gameAreaWidth}px`;
        particle.style.top = `${Math.random() * gameAreaHeight}px`;
        
        // Random size
        const size = Math.random() * 20 + 10;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random direction
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        gameArea.appendChild(particle);
        
        // Animate particle
        const particleInterval = setInterval(() => {
            if (!gameActive) {
                clearInterval(particleInterval);
                particle.remove();
                return;
            }
            
            const currentLeft = parseFloat(particle.style.left);
            const currentTop = parseFloat(particle.style.top);
            
            particle.style.left = `${currentLeft + vx}px`;
            particle.style.top = `${currentTop + vy}px`;
            
            // Remove if out of bounds
            if (currentLeft < 0 || currentLeft > gameAreaWidth || 
                currentTop < 0 || currentTop > gameAreaHeight) {
                clearInterval(particleInterval);
                particle.remove();
            }
        }, 16);
        
        // Remove after some time
        setTimeout(() => {
            clearInterval(particleInterval);
            if (particle.parentNode) {
                particle.remove();
            }
        }, 3000);
    }
}); 