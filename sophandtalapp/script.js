document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // FAIL-SAFE RADAR PING SOUND GENERATOR
    // ==========================================
    function playSonarPing() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(850, ctx.currentTime); // High sub ping frequency
            osc.frequency.exponentialRampToValueAtTime(430, ctx.currentTime + 0.4); 
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8); // Decay
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
        } catch (e) {
            console.log("Audio waiting for user click interaction.");
        }
    }

    // ==========================================
    // MODULE 1: SONAR RADAR GRID
    // ==========================================
    (() => {
        try {
            const sonarGrid = document.getElementById("sonar-grid-board");
            const sonarStatus = document.getElementById("sonar-status");
            if (!sonarGrid) return;

            const size = 5;
            const animals = ["🐋 Blue Whale", "🐬 Dolphin", "🐢 Sea Turtle", "🐙 Octopus", "🦈 Great White"];
            const targetAnimal = animals[Math.floor(Math.random() * animals.length)];
            const targetRow = Math.floor(Math.random() * size);
            const targetCol = Math.floor(Math.random() * size);

            sonarGrid.innerHTML = "";
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const cell = document.createElement("div");
                    cell.className = "sonar-cell";
                    cell.addEventListener("click", () => {
                        playSonarPing(); // Play the direct sound
                        cell.style.backgroundColor = "rgba(0, 210, 211, 0.4)";
                        const dist = Math.abs(r - targetRow) + Math.abs(c - targetCol);
                        
                        if (dist === 0) {
                            cell.style.backgroundColor = "#2ecc71";
                            cell.innerHTML = "🎯";
                            sonarStatus.innerHTML = `Sonar Status: SUCCESS! Found a ${targetAnimal}!`;
                        } else if (dist <= 2) {
                            sonarStatus.innerHTML = "Sonar Status: STRONG signature nearby! 🔥";
                        } else {
                            sonarStatus.innerHTML = "Sonar Status: Weak echo... adjusting frequencies. 🌊";
                        }
                    });
                    sonarGrid.appendChild(cell);
                }
            }
        } catch (err) { console.error("Sonar engine initialization paused:", err); }
    })();

    // ==========================================
    // MODULE 2: BASIC FUNCTIONAL TRIVIA
    // ==========================================
    (() => {
        try {
            const qText = document.getElementById("question-text");
            const aBox = document.getElementById("answers-box");
            const fBox = document.getElementById("t1");
            const nBtn = document.getElementById("next-fact-btn");
            if (!qText || !aBox) return;

            const facts = [
                {
                    q: "How much of Earth's volcanic activity happens underwater?",
                    a: ["Around 10%", "Roughly 50%", "Over 80%", "None at all"],
                    c: 2,
                    f: "Over 80% of volcanic eruptions happen deep beneath the ocean surface!"
                },
                {
                    q: "Why is the deep ocean completely pitch black?",
                    a: ["Sunlight can't travel past 650 feet", "The water is too dirty", "Fish absorb light", "Plants block it"],
                    c: 0,
                    f: "Sunlight fades rapidly, leaving anything deeper than 650 feet in darkness."
                }
            ];

            let index = 0;

            function showQuestion() {
                fBox.innerHTML = "";
                if (nBtn) nBtn.style.display = "none";
                const current = facts[index];
                qText.innerText = current.q;
                aBox.innerHTML = "";

                current.a.forEach((opt, idx) => {
                    const btn = document.createElement("button");
                    btn.className = "trivia-btn";
                    btn.innerText = opt;
                    btn.addEventListener("click", () => {
                        if (idx === current.c) {
                            fBox.innerHTML = `<span style="color: #2ecc71;">✅ Correct! ${current.f}</span>`;
                            if (nBtn) nBtn.style.display = "inline-block";
                        } else {
                            fBox.innerHTML = `<span style="color: #e74c3c;">❌ Systems re-calibrating. Try another tracking answer!</span>`;
                        }
                    });
                    aBox.appendChild(btn);
                });
            }

            if (nBtn) {
                nBtn.addEventListener("click", () => {
                    index = (index + 1) % facts.length;
                    showQuestion();
                });
            }

            showQuestion();
        } catch (err) { console.error("Trivia engine initialization paused:", err); }
    })();

    // ==========================================
    // MODULE 3: FIXING COLOR BY NUMBER (15x15)
    // ==========================================
    (() => {
        try {
            const grid = document.getElementById("ocean-grid");
            const palette = document.getElementById("ocean-palette");
            if (!grid || !palette) return;

            const colors = {
                1: "#ff4757", 2: "#ff7f50", 3: "#ffa502", 4: "#2ed573",
                5: "#1e90ff", 6: "#70a1ff", 7: "#5352ed", 8: "#ed4c67",
                9: "#ff6b81", 10: "#ff6348", 11: "#eccc68", 12: "#ffffff",
                0: "#111a24"
            };

            const layout = [
                0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
                0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,
                0,0,0,0,1,2,3,3,3,2,1,0,7,0,0,
                0,0,8,0,1,2,3,12,3,2,1,7,7,0,0,
                0,8,8,1,2,2,3,3,3,2,2,1,7,7,0,
                8,8,1,2,2,2,4,4,4,2,2,2,1,7,7,
                8,1,2,2,2,4,11,11,11,4,2,2,2,1,7,
                8,8,1,2,2,2,4,4,4,2,2,2,1,7,7,
                0,8,8,1,2,2,2,2,2,2,2,1,7,7,0,
                0,0,8,0,1,2,5,5,5,2,1,7,7,0,0,
                0,0,0,0,1,2,6,6,6,2,1,0,7,0,0,
                0,0,0,0,0,1,9,9,9,1,0,0,0,0,0,
                0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,
                0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
            ];

            let activeColorKey = null;

            palette.innerHTML = "";
            Object.keys(colors).forEach(key => {
                if (key == 0) return; 
                const swatch = document.createElement("div");
                swatch.className = "palette-swatch";
                swatch.style.backgroundColor = colors[key];
                swatch.innerText = key;
                
                if(["3","4","11","12"].includes(key)) swatch.style.color = "#000000";

                swatch.addEventListener("click", () => {
                    document.querySelectorAll(".palette-swatch").forEach(s => s.style.border = "none");
                    swatch.style.border = "2px solid #00d2d3";
                    activeColorKey = key;
                });
                palette.appendChild(swatch);
            });

            grid.innerHTML = "";
            layout.forEach(num => {
                const pixel = document.createElement("div");
                pixel.className = "cbn-pixel";
                pixel.innerText = num;

                pixel.addEventListener("click", () => {
                    if (activeColorKey && parseInt(activeColorKey) === num) {
                        pixel.style.backgroundColor = colors[num];
                        pixel.style.color = "transparent";
                        pixel.style.border = "none";
                    }
                });
                grid.appendChild(pixel);
            });
        } catch (err) { console.error("Color-by-number initialization paused:", err); }
    })();
});