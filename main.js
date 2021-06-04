const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, screen, Menu, MenuItem, nativeImage, Tray } = require('electron');

/**
 * @type {BrowserWindow}
 */
let win = null;

/**
 * @type {Menu}
 */
let menu = null;

let nowData = {};

function createWindow () {   
  // 创建浏览器窗口
  win = new BrowserWindow({
    height: 200,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
    transparent: true,
    modal: true,
    show: false,
    alwaysOnTop: true,
    type: 'textured',
    opacity: 0,
    vibrancy: 'popover',
    skipTaskbar: true,
  });
  win.setHasShadow(true);
  win.setVisibleOnAllWorkspaces(true);
  const runEnv = process.env.RUN_ENV;
  console.log('env', runEnv);
  if (runEnv === 'pro') {
    // 并且为你的应用加载index.html
    win.loadFile('build/index.html');
  } else {
    win.loadURL('http://127.0.0.1:3000');    
    // 打开开发者工具
    // win.webContents.openDevTools();
  }
  win.on('blur', () => win.hide());
  return win;
}

function diff(old) {
  const { text, html, image, rtf, bm } = old;
  const newText = clipboard.readText();
  const newHtml = clipboard.readHTML();
  const newImage = clipboard.readImage();
  const newRtf = clipboard.readRTF();
  const newBm = clipboard.readBookmark();

  if (newImage && !newImage.isEmpty() && newImage.toDataURL() !== image.toDataURL()) {
    old.text = newText;
    old.html = newHtml;

    old.image = newImage;
    return {
      image: newImage,
      text: newText,
      html: newHtml,
    };
  }

  if (newRtf && newRtf !== rtf) {
    old.text = newText;
    old.html = newHtml;

    old.rtf = newRtf;
    return {
      rtf: rtf,
      text: newText,
    };
  }

  if (newBm && newBm.title !== bm.title && newBm.url !== bm.url) {
    old.text = newText;
    old.html = newHtml;

    old.bm = newBm;
    return {
      bm: newBm,
      text: newText,
    };
  }

  if (newHtml && newHtml !== html) {
    old.text = newText;
    old.html = newHtml;

    return {
      html: newHtml,
      text: newText,
    };
  }

  if (newText && newText !== text) {
    old.text = newText;

    return {
      text: newText,
    };
  }

  return null;
}

const contents = [];


const addItem = (content) => {
  contents.unshift(content);
};

const getItems = () => {
  return contents;
};

// Electron会在初始化完成并且准备好创建浏览器窗口时调用这个方法
// 部分 API 在 ready 事件触发后才能使用。

//当所有窗口都被关闭后退出
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建一个窗口。
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
});

app.whenReady().then(() => {
  win = createWindow();

  const icon = nativeImage.createFromPath(require.resolve('./build/favicon.ico'));
  const appIcon = new Tray(icon.resize({ width: 15, height: 15 }));
  appIcon.displayBalloon({ title: 'copy la', content: 'copy la', icon });

  clipboard.clear();
  let watcherId = null;
  nowData = {
    text: clipboard.readText(),
    html: clipboard.readHTML(),
    image: clipboard.readImage(),
    rtf: clipboard.readRTF(),
    bm: clipboard.readBookmark(),
  };
  const job = () => {
    clearTimeout(watcherId);

    watcherId = setTimeout(() => {
      clearTimeout(watcherId);
      const content = diff(nowData);
      job();
      if (content) {
        addItem(content);
        ipcMain.emit('update', contents);
      }
    }, 500);
  };
  job();

  globalShortcut.register('Alt+v', () => {

    menu = new Menu();
    
    getItems().forEach((ele, index) => {
      const { text, image } = ele;
      if (index) { menu.append(new MenuItem({ type: 'separator' })); }
      console.log(require.resolve('./src/logo.svg'))
      const logo = nativeImage.createFromPath(require.resolve('./build/logo192.png')).resize({ width: 20, height: 20 });
      menu.append(new MenuItem({
        label: `${text.slice(0, 30)}`,
        icon: image ? image.resize({ width: 20, height: 20 }) : logo,
        click: () => {
          ipcMain.emit('set-clipboard', index);
        },
      }))
    });

    menu.on("menu-will-close", () => {

      if (menu) {
        menu.items = null;
        menu = null;
      }
    });
    appIcon.setContextMenu(menu);
    menu.popup();
  });
});

ipcMain.handle('fetch', () => {
  console.log('fetch');
  return getItems();
});

ipcMain.on('set-clipboard', (index) => {
  console.log(index);
  const content = getItems()[index];
  const { html, text, image, rtf, bm } = content;
  console.log(content);
  if (html) {
    clipboard.writeHTML(html);
    clipboard.writeText(text);
  } else if (image) {
    clipboard.writeImage(image);
    clipboard.writeText(text);
  } else if (rtf) {
    clipboard.writeRTF(rtf);
    clipboard.writeText(text);
  } else if (bm) {
    clipboard.writeBookmark(bm);
    clipboard.writeText(text);
  } else {
    clipboard.writeText(text);
  }
  nowData = {
    text: clipboard.readText(),
    html: clipboard.readHTML(),
    image: clipboard.readImage(),
    rtf: clipboard.readRTF(),
    bm: clipboard.readBookmark(),
  };
  console.log(nowData);
  if (menu) menu.closePopup();
});
