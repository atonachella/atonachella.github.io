/**
 * COLOR BY NUMBER ENGINE
 * Handles cross-platform touch/click input mapping
 */
function initializeColorByNumber(config) {
    const gridNode = document.getElementById(config.gridId);
    const paletteNode = document.getElementById(config.paletteId);

    if (!gridNode || !paletteNode) return;

    let selectedColorNumber = null;

    // 1. Generate Palette UI elements
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

    // 2. Build Grid Canvas
    config.layoutMap.forEach(row => {
        row.forEach(targetColorNum => {
            const square = document.createElement('div');
            square.className = 'cbn-cell';
            square.textContent = targetColorNum;
            
            const handlePaint = (e) => {
                // Allows tapping through without breaking browser page-scroll gestures
                if (selectedColorNumber === targetColorNum) {
                    square.style.backgroundColor = config.paletteColors[targetColorNum];
                    square.style.color = config.paletteColors[targetColorNum];
                    square.style.borderColor = config.paletteColors[targetColorNum];
                }
            };

            // Double input binding for zero-latency cross-platform responses
            square.addEventListener('click', handlePaint);
            square.addEventListener('touchstart', handlePaint, { passive: true });
            
            gridNode.appendChild(square);
        });
    });
}