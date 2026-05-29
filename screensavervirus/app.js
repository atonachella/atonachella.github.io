// ==========================================
// YOUR ORIGINAL CODE HERE
// (Paste your screensaver logic and animations below)
// ==========================================




// ==========================================
// NATIVE WINDOWS EXIT CONTROLS
// (Keeps the screensaver from getting trapped)
// ==========================================
function exitScreensaver() {
    // Safely attempts to close the window when input is detected
    window.close();
}

// Listen for user activity to dismiss the screensaver
window.addEventListener('mousemove', exitScreensaver);
window.addEventListener('keydown', exitScreensaver);
window.addEventListener('click', exitScreensaver);