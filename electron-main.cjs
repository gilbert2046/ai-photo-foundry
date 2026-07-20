const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let mainWindow;
let localServer;

app.setPath('userData', path.join(app.getPath('appData'), 'photo-foundry'));
app.setName('Photo Foundry');

function migrateStorageOnce(source, destination) {
  if (!source || !fs.existsSync(source) || fs.existsSync(path.join(destination, 'results.json'))) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of ['results.json', 'trash.json', 'images', 'trash']) {
    const sourcePath = path.join(source, entry);
    if (!fs.existsSync(sourcePath)) continue;
    fs.cpSync(sourcePath, path.join(destination, entry), { recursive: true, errorOnExist: false });
  }
}

function findLegacyProject() {
  const candidates = [__dirname];
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'storage', 'results.json')));
}

async function startLocalServer() {
  const dataDirectory = path.join(app.getPath('userData'), 'storage');
  const legacyProject = findLegacyProject();
  migrateStorageOnce(legacyProject && path.join(legacyProject, 'storage'), dataDirectory);

  process.env.PHOTO_FOUNDRY_DATA_DIR = dataDirectory;
  if (legacyProject) {
    const envCandidates = [path.join(legacyProject, '.env'), path.join(legacyProject, '..', '.env')];
    process.env.PHOTO_FOUNDRY_ENV_FILE = envCandidates.find((candidate) => fs.existsSync(candidate)) || '';
  }
  process.env.PORT = '0';

  const serverModule = await import(pathToFileURL(path.join(__dirname, 'server.js')).href);
  const ready = await serverModule.serverReady;
  localServer = ready.server;
  return ready.port;
}

function createMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Photo Foundry',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏 Photo Foundry' },
        { role: 'hideOthers', label: '隐藏其他' },
        { type: 'separator' },
        { role: 'quit', label: '退出 Photo Foundry' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '显示',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '关闭窗口' },
      ],
    },
  ]));
}

async function createWindow() {
  const port = await startLocalServer();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 640,
    title: 'Photo Foundry',
    backgroundColor: '#050a12',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.executeJavaScript(
      "document.documentElement.classList.add('desktop-app')",
    );
  });
  await mainWindow.loadURL(`http://127.0.0.1:${port}`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  createMenu();
  await createWindow();
  app.on('activate', () => {
    if (!mainWindow) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (localServer?.listening) localServer.close();
});
