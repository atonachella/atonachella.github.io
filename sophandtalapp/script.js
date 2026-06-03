/**
 * ==========================================================================
 * AUDIO ENGINE: SYNTHESIZED ELECTRONIC SONAR PING
 * ==========================================================================
 */
function playSonarPingSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Classic high-pitched submarine sonar signature
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High A note
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4); 
        
        // Smooth audio decay to simulate an underwater echo echo
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.4);
    } catch (error) {
        console.log("Audio playback blocked until user interacts with the page.");
    }
}

/**
 * ==========================================================================
 * GAME MODULE 1: SOPHIA'S SUBMARINE SONAR SCANNER
 * ==========================================================================
 */
function initSonarGame() {
    const container = document.getElementById('sonar-grid-board');
    if (!container) return; // Guard clause to prevent crashing on other pages

    container.innerHTML = ''; // Clear out any stale nodes
    
    const targetX = Math.floor(Math.random() * 5);
    const targetY = Math.floor(Math.random() * 5);
    const creatures = ['🐋 Blue Whale!', ' Squid!', '🐬 Playful Dolphin!', '🦈 Friendly Shark!'];
    const chosenCreature = creatures[Math.floor(Math.random() * creatures.length)];

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const block = document.createElement('div');
            block.className = 'sonar-ping-node';
            
            block.addEventListener('click', () => {
                // Trigger the electronic audio ping on click
                playSonarPingSound();
                
                if (r === targetY && c === targetX) {
                    block.textContent = '👾';
                    block.style.background = '#2ecc71';
                    document.getElementById('sonar-status').innerHTML = `<strong>Sonar Lock Status:</strong> Found a ${chosenCreature}`;
                } else {
                    const distance = Math.abs(r - targetY) + Math.abs(c - targetX);
                    block.style.background = 'rgba(235, 94, 85, 0.2)';
                    if (distance <= 2) {
                        block.textContent = '🟡';
                        document.getElementById('sonar-status').textContent = "Pinger Status: Warm Signal Detected Nearby!";
                    } else {
                        block.textContent = '🔵';
                        document.getElementById('sonar-status').textContent = "Pinger Status: Cold Water. Scan elsewhere!";
                    }
                }
            });
            container.appendChild(block);
        }
    }
}

/**
 * ==========================================================================
 * GAME MODULE 2: NATALIA'S MAJESTIC ANIMAL CARD FLIP
 * ==========================================================================
 */
function initCardFlipGame() {
    const board = document.getElementById('memory-board');
    if (!board) return;

    board.innerHTML = '';

    const items = ['🦄', '🦄', '🦁', '🦁', '🐉', '🐉', '🦅', '🦅', '🦊', '🦊', '🐼', '🐼', '🐺', '🐺', '✨', '✨'];
    items.sort(() => Math.random() - 0.5);

    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;

    items.forEach(emoji => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
            <div class="card-back">⭐</div>
            <div class="card-front">${emoji}</div>
        `;

        card.addEventListener('click', () => {
            if (lockBoard || card === firstCard || card.classList.contains('flipped')) return;

            card.classList.add('flipped');

            if (!firstCard) {
                firstCard = card;
                return;
            }

            secondCard = card;
            lockBoard = true;

            const isMatch = firstCard.querySelector('.card-front').textContent === secondCard.querySelector('.card-front').textContent;
            if (isMatch) {
                firstCard = null;
                secondCard = null;
                lockBoard = false;
            } else {
                setTimeout(() => {
                    firstCard.classList.remove('flipped');
                    secondCard.classList.remove('flipped');
                    firstCard = null;
                    secondCard = null;
                    lockBoard = false;
                }, 1000);
            }
        });

        board.appendChild(card);
    });
}

/**
 * ==========================================================================
 * GAME MODULE 3: COLOR BY NUMBER ENGINE
 * ==========================================================================
 */
function initializeColorByNumber(config) {
    const gridNode = document.getElementById(config.gridId);
    const paletteNode = document.getElementById(config.paletteId);
    if (!gridNode || !paletteNode) return;

    gridNode.innerHTML = '';
    paletteNode.innerHTML = '';

    let selectedColorNumber = null;

    Object.keys(config.paletteColors).forEach(num => {
        const swatch = document.createElement('div');
        swatch.className = 'cbn-color-swatch';
        swatch.style.backgroundColor = config.paletteColors[num];
        swatch.textContent = num;
        
        swatch.addEventListener('click', () => {
            paletteNode.querySelectorAll('.cbn-color-swatch').forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            selectedColorNumber = parseInt(num);
        });
        paletteNode.appendChild(swatch);
    });

    config.layoutMap.forEach(row => {
        row.forEach(targetColorNum => {
            const square = document.createElement('div');
            square.className = 'cbn-cell';
            square.textContent = targetColorNum;
            
            const handlePaint = () => {
                if (selectedColorNumber === targetColorNum) {
                    square.style.backgroundColor = config.paletteColors[targetColorNum];
                    square.style.color = config.paletteColors[targetColorNum];
                    square.style.border = `1px solid ${config.paletteColors[targetColorNum]}`;
                }
            };

            square.addEventListener('click', handlePaint);
            square.addEventListener('touchstart', handlePaint, { passive: true });
            gridNode.appendChild(square);
        });
    });
}