document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // GAME 1: SONAR RADAR SCANNER ENGINE
    // ==========================================
    const sonarGrid = document.getElementById("sonar-grid-board");
    const sonarStatus = document.getElementById("sonar-status");
    const sonarAudio = document.getElementById("sonar-sound") || document.getElementById("sonar-ping");

    if (sonarGrid) {
        const gridSize = 5; // 5x5 Grid
        const animalNames = ["🐋 Blue Whale", "🐬 Dolphin", "🐢 Sea Turtle", "🐙 Octopus", "🦈 Great White"];
        const hiddenAnimal = animalNames[Math.floor(Math.random() * animalNames.length)];
        const targetRow = Math.floor(Math.random() * gridSize);
        const targetCol = Math.floor(Math.random() * gridSize);

        sonarGrid.innerHTML = ""; // Clear placeholder data

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cell = document.createElement("div");
                cell.classList.add("sonar-cell");
                
                cell.addEventListener("click", () => {
                    // Trigger Audio Ping safely
                    if (sonarAudio) {
                        sonarAudio.currentTime = 0;
                        sonarAudio.play().catch(err => console.log("Audio waiting for user interaction."));
                    }

                    // Create visual ripple effect on click
                    cell.style.backgroundColor = "rgba(0, 210, 211, 0.4)";
                    
                    // Calculate absolute distance to target animal
                    const distance = Math.abs(r - targetRow) + Math.abs(c - targetCol);
                    
                    if (distance === 0) {
                        cell.style.backgroundColor = "#2ecc71";
                        cell.innerHTML = "🎯";
                        sonarStatus.innerHTML = `Sonar Status: SUCCESS! Found a ${hiddenAnimal}!`;
                    } else if (distance <= 2) {
                        sonarStatus.innerHTML = "Sonar Status: Ping returns STRONG signature nearby! 🔥";
                    } else {
                        sonarStatus.innerHTML = "Sonar Status: Weak echo... adjusting frequencies. 🌊";
                    }
                });
                sonarGrid.appendChild(cell);
            }
        }
    }

    // ==========================================
    // GAME 2: DEEP-SEA TRIVIA ENGINE
    // ==========================================
    const questionText = document.getElementById("question-text");
    const answersBox = document.getElementById("answers-box");
    const feedbackBox = document.getElementById("t1");
    const nextBtn = document.getElementById("next-fact-btn");

    if (questionText && answersBox) {
        const oceanFacts = [
            {
                q: "How much of Earth's volcanic activity happens underwater?",
                a: ["Around 10%", "Roughly 50%", "Over 80%", "None at all"],
                correct: 2,
                fact: "Over 80% of volcanic eruptions happen deep beneath the ocean surface!"
            },
            {
                q: "Why is the deep ocean completely pitch black?",
                a: ["Sunlight can't travel past 650 feet", "The water is too dirty", "Fish absorb all the light", "Plants block the sun"],
                correct: 0,
                fact: "Sunlight fades rapidly, leaving anything deeper than 200 meters (650 feet) in absolute darkness."
            },
            {
                q: "How do deep-sea creatures glow in the dark?",
                a: ["They swallow flashlights", "Bioluminescence chemical reactions", "They reflect the moon", "Static electricity"],
                correct: 1,
                fact: "They use bioluminescence, producing their own light to hunt, communicate, and hide!"
            },
            {
                q: "What color is the blood of a giant deep-sea octopus?",
                a: ["Red", "Blue", "Green", "Transparent"],
                correct: 1,
                fact: "Octopus blood contains a copper-rich protein called hemocyanin, which turns their blood clear blue!"
            }
        ];

        let currentFactIndex = 0;

        function displayFact() {
            feedbackBox.innerHTML = "";
            if (nextBtn) nextBtn.style.display = "none";
            
            let currentData = oceanFacts[currentFactIndex];
            questionText.innerText = currentData.q;
            answersBox.innerHTML = "";

            currentData.a.forEach((option, idx) => {
                const btn = document.createElement("button");
                btn.className = "trivia-btn";
                btn.innerText = option;
                btn.onclick = () => {
                    if (idx === currentData.correct) {
                        feedbackBox.innerHTML = `<span style="color: #2ecc71;">✅ Correct! ${currentData.fact}</span>`;
                        if (nextBtn) nextBtn.style.display = "inline-block";
                    } else {
                        feedbackBox.innerHTML = `<span style="color: #e74c3c;">❌ Systems re-calibrating. Try another tracking answer!</span>`;
                    }
                };
                answersBox.appendChild(btn);
            });
        }

        // Global bridge so HTML button onclick attribute functions correctly
        window.loadNextFact = function() {
            currentFactIndex = (currentFactIndex + 1) % oceanFacts.length;
            displayFact();
        };

        displayFact(); // Initialize first trivia question
    }

    // ==========================================
    // GAME 3: COLOR BY NUMBER ENGINE
    // ==========================================
    const colorGrid = document.getElementById("ocean-grid");
    const colorPalette = document.getElementById("ocean-palette");

    if (colorGrid && colorPalette) {
        // Simple fish pixel map configuration (0=water, 1=orange fish, 2=yellow stripes)
        const pixelLayout = [
            0, 0, 1, 1, 0, 0,
            0, 1, 1, 2, 1, 0,
            1, 1, 2, 1, 1, 1,
            0, 1, 1, 1, 1, 0,
            0, 0, 1, 1, 0, 0
        ];

        const colors = {
            0: { name: "Deep Water Blue", code: "#1e375a" },
            1: { name: "Clownfish Orange", code: "#ff7f50" },
            2: { name: "Neon Yellow", code: "#f1c40f" }
        };

        let selectedColorKey = null;

        // Render Palette Buttons
        colorPalette.innerHTML = "";
        Object.keys(colors).forEach(key => {
            const swatch = document.createElement("div");
            swatch.className = "palette-swatch";
            swatch.style.backgroundColor = colors[key].code;
            swatch.innerText = key;
            swatch.title = colors[key].name;
            
            swatch.onclick = () => {
                document.querySelectorAll(".palette-swatch").forEach(s => s.style.transform = "scale(1)");
                swatch.style.transform = "scale(1.2)";
                swatch.style.border = "2px solid #ffffff";
                selectedColorKey = key;
            };
            colorPalette.appendChild(swatch);
        });

        // Render Canvas Grid
        colorGrid.innerHTML = "";
        pixelLayout.forEach(numberValue => {
            const pixel = document.createElement("div");
            pixel.className = "cbn-pixel";
            pixel.innerText = numberValue;

            pixel.onclick = () => {
                if (selectedColorKey === null) {
                    alert("Select a brush code number from the palette first!");
                    return;
                }
                if (parseInt(selectedColorKey) === numberValue) {
                    pixel.style.backgroundColor = colors[numberValue].code;
                    pixel.style.color = "transparent"; // Hide helper number text on success
                    pixel.style.border = "none";
                }
            };
            colorGrid.appendChild(pixel);
        });
    }
});