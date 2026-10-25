# Sara Note

Source repository for Sara Note. The current Windows application is still named **CuteNotes 1.1.1**; the application rename will be handled in a later update.

Version 1.1.1 improves readability: larger toolbar labels and SVG icons, darker text/icon contrast, and larger small labels throughout the app.

A Windows desktop notebook with text and code tabs, an Excalidraw whiteboard, tasks, floating sticky notes and portable backups. Works offline. Sinhala and other Unicode text are supported.

## New in 1.1 — Little idea studio

The drawing workspace now uses a custom CuteNotes interface: a compact pencil case, pastel ink/fill palettes, paper colors and a dedicated viewport bar. The underlying drawing engine remains Excalidraw; this is a custom interface and tool collection built on that engine.

Open **Little extras** to add editable Sticky cards, a connected Flowchart, a Mind map, a text Checklist card, and gold-star/heart stamps. Double-click text to edit it. The checklist is a drawing template; use the app's Little to-dos panel for interactive task checkboxes.

The new controls also support a pastel Highlighter, embedded PNG/JPG/WebP/GIF images (up to 8 MB), selection duplication/deletion, Undo/Redo, a drawing grid, fit-to-content, zoom, paper colors and confirmed clearing with Undo. **Export → PNG / SVG** saves a drawing image. Existing saved whiteboards remain compatible.

Each drawing must fit within the note storage limit. If an image would make a board too large to save, the app asks you to choose a smaller image or start another board before inserting it.

Excalidraw is MIT-licensed. Its copyright and permission notice is included in `licenses/Excalidraw-MIT.txt` in the source and `resources/licenses/Excalidraw-MIT.txt` in the installed app. Other bundled dependency notices remain in the distribution. Changing an interface is not a guarantee about legal claims; the applicable license and notices still matter.

## Install and open

Run **CuteNotes-Setup-1.1.1.exe** in the adjacent `installers` folder. Choose your installation folder, complete Setup, and launch CuteNotes from the desktop or Start menu. Windows x64 is the build target. No Node.js, Rust, development tools or account is required to run the installed app.

The installer is unsigned; Windows may show an unknown-publisher prompt. This build has not been submitted for a publisher certificate.

## Everyday use

- **New note / Ctrl N:** create a text note. Click its title to rename it. The language menu supports Markdown, plain text, JavaScript, TypeScript, Python, C/C++, HTML, CSS and JSON.
- **Whiteboard / Ctrl Shift N:** use the small + beside your collection heading or the shortcut. Draw shapes and arrows, write, add images, and export PNG or SVG with the buttons above the board. Drawing assets and fonts ship inside the app.
- **Auto-save:** edits save after a short pause. The save badge reports pending changes and lets you retry after an error. Closing the main window waits for pending changes to save.
- **Ctrl O / Open file:** import a UTF-8 text/code file, up to 10 MB. Export a text note using its download button.
- **Ctrl K:** search note titles and text. The star adds a note to Favorites. Closing a tab keeps the note in your collection; the trash button deletes it after confirmation.
- **Little to-dos:** add tasks and check them off. Pin an individual task, or open the desktop companion with **Pin to desktop**. The floating window stays above other windows and supports a free-text sticky note with four color choices. Tasks are shared between the two windows.
- **Settings & backups:** choose light/dark appearance and editor font size.

## Back up your notebook

Use **Backup** or **Settings → Export backup**. A `.cutenote` file contains your notes, whiteboard scenes and embedded images, tasks, and desktop sticky text/color. It is gzip-compressed JSON with a versioned format. Credentials and Google tokens are excluded. Backups are not encrypted; keep private backups somewhere you trust. The maximum uncompressed backup size is 50 MB.

**Import backup** offers Merge or Replace. Merge keeps unrelated items and replaces items with matching IDs. Replace restores the backup as the entire notebook. Before either operation, CuteNotes keeps a recovery copy of the current SQLite database under `recovery` in the local data folder. You can also double-click an associated `.cutenote` file to open the restore prompt.

Local data is stored under `%APPDATA%\cutenotes\cutenotes.sqlite`. Use **Settings → Open local data folder** to find it. Uninstalling does not intentionally delete your notebook. To recover a saved `recovery\before-restore-*.sqlite` file, close CuteNotes, preserve a copy of the existing database, and copy the recovery file to `cutenotes.sqlite`.

## Optional Google Drive backup

The installed app has the Google connection and backup implementation. You must supply credentials for your own Google Cloud project; no shared developer credentials are embedded in this build.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and enable **Google Drive API**.
2. Configure Google Auth Platform / the consent screen. If the app is in testing, add your own Google account as a test user.
3. Create an **OAuth client ID** with application type **Desktop app**. Download its client JSON.
4. Open CuteNotes **Settings → Google Drive → Google Desktop OAuth configuration**. Enter `client_id` and `client_secret` from the JSON's `installed` section.
5. Click **Connect Google Drive** and finish sign-in in your system browser. Return to CuteNotes.
6. **Back up now** uploads the current `.cutenote` notebook. Enable automatic backup to upload changes every five minutes while the app is running. **Restore** explicitly downloads the cloud backup and asks whether to merge or replace local notes.

This is one-device cloud backup and manual restore, not conflict-resolving multi-device collaboration. Do not enable automatic backups on multiple computers against the same account unless you intend the most recent upload to replace the previous cloud backup. Local edits remain available after a network error. A later automatic cycle retries. Reconnect if Google expires or revokes the refresh token; projects in Google's testing mode can have limited token lifetimes.

The app requests only `drive.appdata`. OAuth uses the system browser, a temporary `127.0.0.1` callback and PKCE. Tokens are stored using Electron's Windows-backed `safeStorage` encryption. Live Google sign-in/upload/restore requires your Google project and was not exercised against a real account during this build.

## Source and builds

This deliverable uses **Electron + React + TypeScript + SQLite (sql.js)**. The original Tauri architecture would require Rust and Microsoft C++ build tools, which were unavailable on this computer. Electron makes it possible to ship a working Windows installer from the available environment; it uses more disk space and memory than a comparable Tauri application. CodeMirror provides the code editor, Zustand manages UI state and Excalidraw provides the drawing module.

With Node.js 22 or later:

```powershell
npm ci
npm run build
npm start
npm test
npm run dist
```

`npm run dist` creates an x64 NSIS installer in `../installers`. Electron Builder downloads packaging tools on the first build. Builds do not require a native SQLite compiler because the database engine uses WebAssembly in the main process. `npm run dev` starts only the UI server; use `npm run build` followed by `npm start` for the desktop app and its local data bridge.

Renderer windows use sandboxing, context isolation, no Node integration, a narrow preload bridge and validated IPC senders. Data is validated at the storage boundary; imports validate the complete payload before any database changes. Writes persist to a temporary file and rename it, with an in-memory rollback if persistence fails. An existing damaged database is preserved instead of silently replaced. The main window's close flow waits for the renderer and sticky window to finish saving.

## References

- [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security)
- [Google OAuth for desktop apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google Drive app data](https://developers.google.com/workspace/drive/api/guides/appdata)
- [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/)
