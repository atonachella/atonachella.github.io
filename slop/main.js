const { app, BrowserWindow, screen } = require('electron');

function createWindow() {
  // Get the primary display size
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    fullscreen: true,       // Forces full screen
    frame: false,           // Strips title bar and buttons
    kiosk: true,            // This is the "God Mode" setting that kills EVERYTHING else
    webPreferences: { 
      nodeIntegration: true,
      contextIsolation: false 
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// This ensures the app closes when you hit a key or click, 
// matching the logic we added to your script.js
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});