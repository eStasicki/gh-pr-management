import { app, BrowserWindow, shell, Menu } from "electron";
import * as path from "path";
import { existsSync, readFileSync, statSync } from "fs";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

const getBuildPath = (): string => {
  if (app.isPackaged) {
    const appPath = app.getAppPath();
    const buildPath = path.join(path.dirname(appPath), "build");
    if (existsSync(buildPath)) {
      return buildPath;
    }
    return path.join(appPath, "build");
  }
  const electronDist = __dirname;
  return path.resolve(electronDist, "../../build");
};

const buildPath = getBuildPath();
const indexPath = path.join(buildPath, "index.html");
const localPort = 5174;
const localHost = "127.0.0.1";

let mainWindow: BrowserWindow | null = null;
let localServer: Server | null = null;

const getMimeType = (ext: string): string => {
  const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

const startLocalServer = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (localServer) {
      resolve(`http://${localHost}:${localPort}`);
      return;
    }

    if (!existsSync(buildPath)) {
      reject(new Error("Build directory not found"));
      return;
    }

    localServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = req.url || "/";
      console.log(
        `[Server] Request: ${url} from ${req.headers["user-agent"]?.substring(
          0,
          50
        )}`
      );

      let requestPath = decodeURIComponent(url);

      if (requestPath === "/") {
        requestPath = "/index.html";
      }

      let filePath: string = path.join(buildPath, requestPath);

      const normalizedPath: string = path.resolve(filePath);
      const buildPathResolved: string = path.resolve(buildPath);

      if (
        !normalizedPath.startsWith(buildPathResolved + path.sep) &&
        normalizedPath !== buildPathResolved
      ) {
        console.log(
          `[Server] Path outside build directory (${normalizedPath}), using index.html`
        );
        filePath = indexPath;
      }

      const finalPath: string = path.resolve(filePath);

      const headers: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      if (req.method === "OPTIONS") {
        res.writeHead(200, headers);
        res.end();
        return;
      }

      if (existsSync(finalPath)) {
        try {
          const stat = statSync(finalPath);
          if (stat.isFile()) {
            const ext: string = path.extname(finalPath);
            const mimeType: string = getMimeType(ext);
            const content: Buffer = readFileSync(finalPath);

            if (ext === ".html") {
              headers["Content-Security-Policy"] =
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
              headers["X-Content-Type-Options"] = "nosniff";
            }

            headers["Content-Type"] = mimeType;
            res.writeHead(200, headers);
            res.end(content);
            console.log(
              `[Server] ✓ Served: ${requestPath} (${mimeType}, ${content.length} bytes)`
            );
            return;
          }
        } catch (err) {
          console.error("[Server] Error serving file:", err);
        }
      }

      console.log(`[Server] Falling back to index.html for: ${requestPath}`);
      const content: Buffer = readFileSync(indexPath);
      headers["Content-Type"] = "text/html";
      headers["Content-Security-Policy"] =
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
      headers["X-Content-Type-Options"] = "nosniff";
      res.writeHead(200, headers);
      res.end(content);
    });

    localServer.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${localPort} in use, using existing server`);
        resolve(`http://${localHost}:${localPort}`);
      } else {
        console.error("Server error:", err);
        reject(err);
      }
    });

    localServer.listen(localPort, "127.0.0.1", () => {
      console.log(`✓ Local server started on http://${localHost}:${localPort}`);
      const testUrl = `http://${localHost}:${localPort}`;

      setTimeout(() => {
        const httpModule = require("http");
        const testReq = httpModule.get(testUrl, (res: IncomingMessage) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
          });
          res.on("end", () => {
            if (res.statusCode === 200) {
              console.log(
                `✓ Server is responding (status: ${res.statusCode}, ${data.length} bytes)`
              );
            } else {
              console.warn(`Server responded with status ${res.statusCode}`);
            }
            resolve(testUrl);
          });
        });

        testReq.on("error", (err: Error) => {
          console.error("Server test failed:", err.message);
          console.warn("But continuing anyway - server may still work");
          resolve(testUrl);
        });

        testReq.setTimeout(1000, () => {
          console.warn("Server test timeout");
          testReq.destroy();
          resolve(testUrl);
        });
      }, 200);
    });
  });
};

const createWindow = async (): Promise<void> => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    frame: true,
    title: "GPRM",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      devTools: isDev,
    },
    icon: existsSync(path.join(__dirname, "../static/icon-512.png"))
      ? path.join(__dirname, "../static/icon-512.png")
      : existsSync(path.join(__dirname, "../static/favicon.png"))
      ? path.join(__dirname, "../static/favicon.png")
      : undefined,
    backgroundColor: "#ffffff",
  });

  const loadApp = async (): Promise<void> => {
    console.log("=== Loading app ===");
    console.log("Build path:", buildPath);
    console.log("Build directory exists:", existsSync(buildPath));
    console.log("Index file exists:", existsSync(indexPath));

    if (!mainWindow) {
      console.error("Main window is null!");
      return;
    }

    try {
      if (existsSync(buildPath)) {
        console.log("Starting local server...");
        const localUrl = await startLocalServer();
        console.log("✓ Server ready, URL:", localUrl);

        console.log("Waiting for server to be fully ready...");
        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log("Loading URL:", localUrl);
        try {
          const loadPromise = mainWindow.loadURL(localUrl);

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Load timeout")), 5000);
          });

          await Promise.race([loadPromise, timeoutPromise]);
          console.log("✓ LoadURL call completed");

          await new Promise((resolve) => setTimeout(resolve, 500));

          const finalUrl = mainWindow?.webContents.getURL();
          console.log("Final URL after load:", finalUrl);

          if (
            finalUrl?.includes("chrome-error") ||
            finalUrl?.includes("error")
          ) {
            console.error("✗ Loaded error page, retrying with longer delay...");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Retrying load...");
            await mainWindow.loadURL(localUrl);

            await new Promise((resolve) => setTimeout(resolve, 500));
            const retryUrl = mainWindow?.webContents.getURL();
            console.log("Retry URL:", retryUrl);

            if (retryUrl?.includes("chrome-error")) {
              throw new Error("Failed to load after retry");
            }
          }
        } catch (loadError: any) {
          console.error(
            "✗ Error loading application:",
            loadError.message || loadError
          );
          throw new Error(`Failed to load application: ${loadError.message}`);
        }
      } else {
        console.error("✗ Build directory not found!");
        console.error("Please run 'npm run build' first to create the build.");

        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Build Required</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background: #f5f5f5;
                }
                .container {
                  text-align: center;
                  background: white;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  max-width: 500px;
                }
                h1 { color: #e74c3c; margin-top: 0; }
                code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
                .command {
                  background: #2c3e50;
                  color: white;
                  padding: 12px;
                  border-radius: 4px;
                  margin: 20px 0;
                  font-family: monospace;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>⚠️ Build Required</h1>
                <p>The application build was not found.</p>
                <p>Please run the following command to create the build:</p>
                <div class="command">npm run build</div>
                <p>Then restart the Electron app.</p>
              </div>
            </body>
          </html>
        `;

        await mainWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`
        );
      }
    } catch (err: any) {
      console.error("✗ Fatal error:", err.message || err);
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: 500px;
              }
              h1 { color: #e74c3c; margin-top: 0; }
              .error { color: #7f8c8d; font-family: monospace; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ Application Error</h1>
              <p>Failed to start the local server or load the application.</p>
              <p class="error">${err.message || "Unknown error"}</p>
              <p>Please check the console for more details.</p>
            </div>
          </body>
        </html>
      `;

      if (mainWindow && !mainWindow.isDestroyed()) {
        await mainWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`
        );
      }
    }
  };

  let loadCompleted = false;

  try {
    await loadApp();
    loadCompleted = true;
    console.log("✓ App loading completed");
  } catch (error: any) {
    console.error("✗ Critical error in loadApp:", error.message || error);
    console.log("Showing window anyway...");
  }

  const showWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log("Showing window...");
      mainWindow.show();
      console.log("✓ Window should be visible now");
    } else {
      console.error("✗ Cannot show window - it was destroyed or is null");
    }
  };

  mainWindow.once("ready-to-show", () => {
    console.log("✓ Event: ready-to-show");
    showWindow();
  });

  setTimeout(() => {
    if (!mainWindow?.isVisible()) {
      console.log("Window not visible after timeout, forcing show...");
      showWindow();
    }
  }, 3000);

  mainWindow.on("show", () => {
    console.log("✓ Window is now visible");
  });

  mainWindow.on("focus", () => {
    console.log("✓ Window focused");
  });

  mainWindow.on("close", (event) => {
    if (process.platform === "darwin") {
      if (!(app as any).quitting) {
        event.preventDefault();
        (app as any).quitting = true;
        app.quit();
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on(
    "did-fail-load",
    async (event, errorCode, errorDescription, validatedURL) => {
      console.error("Failed to load:", {
        errorCode,
        errorDescription,
        validatedURL,
      });

      if (errorCode === -105 || validatedURL?.includes("chrome-error")) {
        console.error("Network error or invalid URL detected");
        if (existsSync(buildPath) && mainWindow && !mainWindow.isDestroyed()) {
          console.log("Retrying with fresh server connection...");
          await new Promise((resolve) => setTimeout(resolve, 500));
          await loadApp();
        } else if (mainWindow && !mainWindow.isDestroyed()) {
          console.log("Build not found, using dev server");
          console.error(
            "Cannot load application without build. Please run 'npm run build' first."
          );
        }
      }
    }
  );

  mainWindow.webContents.on("did-finish-load", () => {
    const url = mainWindow?.webContents.getURL();
    console.log("✓ Page loaded, URL:", url);

    if (url?.includes("chrome-error")) {
      console.error("✗ ERROR: Loaded chrome-error page!");
      return;
    }

    mainWindow?.webContents
      .executeJavaScript(
        `
      (function() {
        console.log('=== Renderer Debug Info ===');
        console.log('Location:', window.location.href);
        console.log('Ready state:', document.readyState);
        console.log('Body exists:', !!document.body);
        console.log('Body content length:', document.body ? document.body.innerHTML.length : 0);
        console.log('Scripts:', document.scripts.length);
        if (window.__sveltekit_j4icf1) {
          console.log('✓ SvelteKit config found:', Object.keys(window.__sveltekit_j4icf1));
        } else {
          console.error('✗ SvelteKit config NOT found!');
        }
        return true;
      })();
    `
      )
      .catch((err) => {
        console.error("Error executing debug JS:", err);
      });
  });

  mainWindow.webContents.on("dom-ready", () => {
    console.log("DOM ready");
  });

  mainWindow.webContents.on(
    "console-message",
    (event, level, message, line, sourceId) => {
      if (level === 1 || level === 3) {
        console.log(`[Renderer ${level === 1 ? "INFO" : "ERROR"}]:`, message);
      }
    }
  );
};

const createApplicationMenu = (): void => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "GPRM",
      submenu: [
        { role: "about", label: "About GPRM" },
        { type: "separator" },
        { role: "services", label: "Services" },
        { type: "separator" },
        { role: "hide", label: "Hide GPRM" },
        { role: "hideOthers", label: "Hide Others" },
        { role: "unhide", label: "Show All" },
        { type: "separator" },
        { role: "quit", label: "Quit GPRM" },
      ],
    },
    {
      label: "File",
      submenu: [{ role: "close", label: "Close Window" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        { role: "selectAll", label: "Select All" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", label: "Reload" },
        { role: "forceReload", label: "Force Reload" },
        {
          role: "toggleDevTools",
          label: "Toggle Developer Tools",
          visible: isDev,
        },
        { type: "separator" },
        { role: "resetZoom", label: "Actual Size" },
        { role: "zoomIn", label: "Zoom In" },
        { role: "zoomOut", label: "Zoom Out" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Toggle Full Screen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize", label: "Minimize" },
        { role: "close", label: "Close" },
      ],
    },
  ];

  if (process.platform !== "darwin") {
    template.unshift({
      label: "File",
      submenu: [{ role: "quit", label: "Quit" }],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(async () => {
  console.log("✓ Electron app is ready");
  createApplicationMenu();
  console.log("Creating window...");
  await createWindow();
  console.log("✓ Window creation completed");

  app.on("activate", async () => {
    console.log("App activated");
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log("No windows, creating new one...");
      await createWindow();
    }
  });
});

app.on("will-finish-launching", () => {
  console.log("App will finish launching");
});

app.on("ready", () => {
  console.log("✓ App ready event");
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
  if (localServer) {
    console.log("Closing local server...");
    localServer.close();
    localServer = null;
  }
  console.log("Quitting app");
  app.quit();
});

app.on("web-contents-created", (_: unknown, contents: any) => {
  contents.on(
    "new-window",
    (event: { preventDefault: () => void }, navigationUrl: string) => {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  );

  if (!isDev) {
    contents.on("devtools-opened", () => {
      contents.closeDevTools();
    });

    contents.on("before-input-event", (event: any, input: any) => {
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        event.preventDefault();
      }
      if (input.control && input.shift && input.key.toLowerCase() === "j") {
        event.preventDefault();
      }
      if (input.f12) {
        event.preventDefault();
      }
    });
  }
});

if (!isDev) {
  app.on("browser-window-created", (_: unknown, window: BrowserWindow) => {
    window.webContents.on("devtools-opened", () => {
      window.webContents.closeDevTools();
    });

    window.webContents.on("before-input-event", (event: any, input: any) => {
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        event.preventDefault();
      }
      if (input.control && input.shift && input.key.toLowerCase() === "j") {
        event.preventDefault();
      }
      if (input.f12) {
        event.preventDefault();
      }
    });
  });
}
