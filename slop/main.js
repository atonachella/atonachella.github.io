const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true, // Forces full screen
    frame: false,     // Removes all title bars and buttons
    webPreferences: { nodeIntegration: true }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);