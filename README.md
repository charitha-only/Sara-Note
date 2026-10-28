<div align="center">

<img src="build/icon.png" width="88" height="88" alt="Sara Note notebook icon" />

# Sara Note 🌷

### A little space for notes, doodles & everyday wins.

Bring your thoughts, code, sketches and little to-dos together in one cozy Windows workspace.

![Windows x64](https://img.shields.io/badge/Windows-x64-879e74?style=flat-square&logo=windows&logoColor=white)
![Version 1.4.0](https://img.shields.io/badge/version-1.4.0-bd8494?style=flat-square)
![Offline notebook](https://img.shields.io/badge/notebook-works_offline-a18abb?style=flat-square)
![More updates planned](https://img.shields.io/badge/more_updates-planned-c19a57?style=flat-square)

**[⬇ Download for Windows](https://github.com/charitha-only/Sara-Note/releases/download/v1.4.0/Sara-Note-Setup-1.4.0.exe)** · **[🌷 All versions](#download-any-version)** · **[Release notes](https://github.com/charitha-only/Sara-Note/releases)** · **[Share an idea](https://github.com/charitha-only/Sara-Note/issues)**

</div>

## Download any version

Pick a little home for your ideas. **New here? Choose 1.4.0**, our recommended Windows release. Every download below is a complete installer with the app runtime included.

| Version & release notes | Highlights | Windows installer |
| --- | --- | --- |
| [🌷 **1.4.0 · Latest**](https://github.com/charitha-only/Sara-Note/releases/tag/v1.4.0) | **Local auto-backup & Note History** | **[⬇ Download](https://github.com/charitha-only/Sara-Note/releases/download/v1.4.0/Sara-Note-Setup-1.4.0.exe)** · **122.3 MiB** |
| [📂 **1.3.0**](https://github.com/charitha-only/Sara-Note/releases/tag/v1.3.0) | Folders & tags, with the smaller installer | [⬇ Download](https://github.com/charitha-only/Sara-Note/releases/download/v1.3.0/Sara-Note-Setup-1.3.0.exe) · 122.3 MiB |
| [🌿 **1.2.1**](https://github.com/charitha-only/Sara-Note/releases/tag/v1.2.1) | All 1.2 features, **36.2% smaller installer** | [⬇ Download](https://github.com/charitha-only/Sara-Note/releases/download/v1.2.1/Sara-Note-Setup-1.2.1.exe) · 122.3 MiB |
| [🎨 **1.2.0**](https://github.com/charitha-only/Sara-Note/releases/tag/v1.2.0) | Colors, themes, layers, PDF/image exports & update alerts | [⬇ Download](https://github.com/charitha-only/Sara-Note/releases/download/v1.2.0/Sara-Note-Setup-1.2.0.exe) · 191.7 MiB |
| [🌿 **1.1.1**](https://github.com/charitha-only/Sara-Note/releases/tag/v1.1.1) | Clear text & crisp icons | [⬇ Download](https://github.com/charitha-only/Sara-Note/releases/download/v1.1.1/CuteNotes-Setup-1.1.1.exe) · 191.7 MiB |
| [🎨 **1.1.0**](https://github.com/charitha-only/Sara-Note/releases/tag/v1.1.0) | Creative studio & templates | [⬇ Download](https://github.com/charitha-only/Sara-Note/releases/download/v1.1.0/CuteNotes-Setup-1.1.0.exe) · 191.7 MiB |
| [🌱 **1.0.0**](https://github.com/charitha-only/Sara-Note/releases/tag/v1.0.0) | The original notebook | [⬇ Download](https://github.com/charitha-only/Sara-Note/releases/download/v1.0.0/CuteNotes-Setup-1.0.0.exe) · 192.3 MiB |

**[Browse the complete release collection →](https://github.com/charitha-only/Sara-Note/releases)** · Each release includes a **SHA256SUMS.txt** file to verify its installer. More updates are planned. ✨

Older installers are kept here for version history. Back up your notebook before switching versions; opening newer data in an older app has not been verified. For installation, choose the **`.exe`** asset. GitHub's automatic **Source code** archives for 1.0.0 and 1.1.0 are hosting snapshots; exact historical source snapshots were not preserved.

![A cozy notebook with sample notes and a task list](docs/images/notebook.png)

> **Now fully Sara Note!** Version 1.2.0 brings the project name into the Windows app, installer and shortcuts. Earlier archived builds still open as CuteNotes. Existing local notes and `.cutenote` backups remain compatible.

## A little way back · 1.4.0 🌷

Keep creating, with a little room to go back.

- **Note History:** click the history icon beside a note's title to preview earlier text or drawings. Save an explicit **checkpoint** whenever a version matters to you. Restoring a version preserves the current saved note in history first.
- **Recover a deleted note:** open **Settings → Local safety net → Recover a deleted note**. Recovery is available while that note's saved versions remain within the retention limits.
- **Local auto-backup:** enabled by default, shortly after opening and every **30 minutes while the app is open**. Unchanged notebooks are skipped. You can also choose **Back up locally now** in Settings.
- **Undo a notebook restore:** restoring a backup saves a **before-restore copy** first. It appears in the same local list so you can restore it if needed. Restore still asks whether to Merge or Replace.
- **Bounded storage:** history keeps up to **30 versions per note**, with **2,000 versions / 20 MiB of compressed snapshots** across the notebook. Rapid automatic saves are grouped within a minute. Local backups retain up to **7 copies within 200 MiB**; older copies expire as limits are reached.

History and automatic copies are stored on this computer. Exported `.cutenote` backups contain the **current notebook**, including folders and tags; they do not include the history timeline or the local backup collection. Both automatic features can be turned off in Settings. Existing notes and backup formats remain supported.

![Preview and restore a saved note checkpoint](docs/images/history-1.4.0.png)

![Local automatic backup settings and before-restore copies](docs/images/backups-1.4.0.png)

## A home for every idea · 1.3.0 🌷

Keep study notes, little projects and tomorrow's sketches in their own cozy corners.

- **Folders:** use the **+ beside Folders** to create, rename and remove folders. Choose a note's folder beneath its title. Removing a folder keeps its notes and tags in **Unfiled**.
- **Tags:** type a tag beneath the note title and press **Enter** or **comma**. You can add up to 20 tags per note, including Sinhala text. Tags are normalized and duplicates are combined. Use the small × on a tag to remove it.
- **Find your next thought:** select a sidebar folder, a tag, or both to filter your collection. Search includes tag words and folder names. **All notes** clears the filters. New notes and drawings inherit your selected folder and tag.
- **Back up the whole collection:** folders, empty folders and tags are included in notebook backups. Merge combines folders with the same name; Replace restores the backed-up collection. Previous 1.x notebooks and backups are supported on upgrade.

**Backup compatibility:** 1.3.0 writes backup format 2 to preserve organization. Restore these new backups with **1.3.0 or later**; older app versions cannot read them. Keep a backup from your existing version before upgrading. Your local data directory stays the same.

![Folders and tags organizing a sample Sinhala and English notebook](docs/images/folders-1.3.0.png)

## A fresh little chapter · 1.2.0 🌷

**Smaller installer · 1.2.1:** the same cozy features came in a **122.3 MiB** Windows installer, down from **191.7 MiB**. Redundant frontend package copies and unused SQLite debug files were removed, with stronger compression. All drawing fonts, language resources and offline runtime remain bundled; installation needs no additional runtime download. Already using 1.2.0 or later? Reopen the app or check for updates in Settings.

- **Your own color circles:** choose any color using the picker or hex input, start from a curated light palette, and save up to 24 custom colors each for ink, fill and drawing paper.
- **Gentle workspace themes:** six light themes plus saved custom pastel themes in Settings.
- **Export every kind of note:** text notes and drawings support **PDF, PNG and JPEG**; drawings also support SVG. **Settings → Export your notes** exports every note into a new folder, one file per note. PDFs paginate long text. A single text image can be up to 16,000 pixels high; use PDF for longer notes.
- **Colors that stay yours:** drawing paper and objects use the chosen colors on screen and in exports, including when the surrounding workspace uses Dark mode.
- **Bring ideas to the front:** move shapes, circles, images and text backward/forward one layer or to the back/front. Attached labels and grouped templates stay together. Undo supports layer changes.
- **A hello when an update arrives:** on opening, Sara Note checks this project's latest public GitHub release. Choose **Download & install** to download, verify the SHA-256 checksum, save your work and open the Windows installer. Check manually in Settings too. Updates need internet; local notes keep working offline.

**Coming from 1.1.1 or earlier?** Download and install the latest version once. Older builds have no update checker; alerts are included from 1.2.0 onward. Back up your notebook before upgrading. The installer remains unsigned and uses the standard interactive installation wizard.

![Light themes, all-note exports and update settings](docs/images/themes-1.2.0.png)

## Your thoughts deserve a lovely little home

Some days you need somewhere to write a thought before it disappears. Other days you want to sketch an idea, save a useful piece of code, or keep a small reminder beside your work.

Sara Note brings those everyday moments together: a tabbed notebook, a pastel drawing studio, a task list and a floating desktop companion. Start with one note. Make a little plan. Keep the next step close.

**No account is required for local notes.** The notebook works offline and saves your changes on your computer. Sinhala and other Unicode text are welcome here too. 🌿

## A peek inside

### 📝 A notebook for words and code

Create several notes, switch between tabs, find an old thought with search and star the ones you want to keep close. Notes save automatically after a short pause, and the save indicator shows their status.

Choose **Markdown, plain text, JavaScript, TypeScript, Python, C/C++, HTML, CSS or JSON** for syntax highlighting. Bring in a UTF-8 text file, copy a snippet or export an individual note when you need it elsewhere.

### 🎨 Little idea studio

A roomy canvas for the things that are easier to draw than explain. Use the custom Sara Note pencil case, pastel ink and fill colors, paper colors, shapes, arrows, text, a highlighter and your own images.

![A pastel flowchart created in the drawing studio](docs/images/idea-studio.png)

Open **Little extras** for a small creative boost:

| A little extra | What you can make |
| --- | --- |
| 🌼 Sticky card | A small, editable home for a thought or reminder |
| 🌿 Flowchart | Three connected steps to get an idea moving |
| 💜 Mind map | A central idea with room for four branches |
| ✅ Checklist card | An editable checklist as part of your drawing |
| ⭐ Gold star | A little encouragement for your board |
| 💗 Love note | A heart stamp for something you love |

![The Little extras collection of cards, templates and stamps](docs/images/creative-tools.png)

Double-click card text to make it yours. Duplicate a selection, undo a change, turn on the grid, zoom in, fit the drawing or export it as **PDF, PNG, JPEG or SVG**. SVG exports include the drawing's images and local fonts.

The checklist card is a drawing template. For interactive checkboxes, use the **Little to-dos** panel.

### 📌 A reminder that stays close

Add a few tasks, tick off a little win and pin a reminder to your desktop. The floating companion stays above your other windows, with a free-text sticky note, four paper colors and the shared task list.

<div align="center">
<img src="docs/images/desktop-companion.png" width="350" alt="A pastel desktop sticky note with sample reminders and tasks" />
</div>

### 💾 Your notebook, packed up neatly

Export your notes, drawing scenes, embedded images, tasks and sticky note into one compressed **`.cutenote` backup**. Restore it later with **Merge** or **Replace**. A local recovery copy is saved before a restore.

Optional **Google Drive backup** is available for users who configure their own Google Desktop OAuth client. It backs up the notebook to the account's private app data folder; cloud restore is a deliberate action. It is a backup feature, rather than automatic conflict-resolving collaboration between several computers. [Google Drive setup →](docs/DEVELOPMENT.md#optional-google-drive-backup)

## Download & settle in

1. **[Download Sara-Note-Setup-1.4.0.exe](https://github.com/charitha-only/Sara-Note/releases/download/v1.4.0/Sara-Note-Setup-1.4.0.exe)** from this project's GitHub release.
2. Open the installer and choose where to install the app.
3. Launch **Sara Note** from the desktop or Start menu, and make your first little note.

**For Windows 10/11, 64-bit.** The installer includes the app runtime and drawing assets. You do not need to install Node.js, Rust, C++ 2010 or DirectX 9 separately. Installation and the local notebook do not require an internet connection; Google sign-in and cloud backup do.

The current installer is unsigned, so Windows may display an unknown-publisher notice. This is an early desktop release. Screenshots on this page use sample notes and tasks to show the app in use.

## A few useful shortcuts

| Do a little thing | Shortcut |
| --- | --- |
| New note | `Ctrl N` |
| New whiteboard | `Ctrl Shift N` |
| Save now | `Ctrl S` |
| Open a text/code file | `Ctrl O` |
| Find a note | `Ctrl K` |
| Undo / redo a drawing change | `Ctrl Z` / `Ctrl Shift Z` |

## More lovely things are on the way ✨

**More updates are planned.** This is the start of Sara Note, and there is room for it to grow with the people who use it.

- [x] Bring the **Sara Note** name into the installed app and installer.
- [x] Add custom colors, light themes, layers and PDF/image exports.
- [x] Show update alerts with verified installer downloads.
- [x] Organize notes and drawings with folders, tags and combined filters.
- [x] Add local automatic backups, note history, checkpoints and deleted-note recovery.
- [x] Make the Windows download smaller while keeping the local experience: 36.2% smaller in 1.2.1.
- [ ] Keep improving readability, spacing and the little details of the interface.
- [ ] Refine the drawing tools and add useful creative extras.
- [ ] Improve backup setup and everyday reliability.
- [ ] Shape future changes around feedback and real use.

These are plans, not features already included or promises of a particular release date. Found a rough edge, or have an idea that would make your day easier? **[Open an issue](https://github.com/charitha-only/Sara-Note/issues)** and help shape the next little update.

## Local by default

Notes are stored in a local SQLite database. Google Drive is optional. Backup files exclude Google credentials and tokens; the backup file itself is not encrypted. Keep a copy somewhere you trust before making major changes to your notebook.

Use **Settings → Open local data folder** to find the notebook on your computer. [Backup, restore and recovery details →](docs/DEVELOPMENT.md#back-up-your-notebook)

## For curious builders

Built with **Electron, React, TypeScript, CodeMirror, Zustand, SQLite (sql.js)** and an **Excalidraw drawing engine with a custom interface and additional tools**.

```powershell
git clone https://github.com/charitha-only/Sara-Note.git
cd Sara-Note
npm ci
npm run build
npm start
```

Use `npm test` for the storage/service checks and `npm run dist` to build a Windows installer. The detailed setup, optional cloud configuration, limits and recovery instructions are in the **[developer & user guide](docs/DEVELOPMENT.md)**. Existing verification is documented in **[TEST-RESULTS.md](TEST-RESULTS.md)**.

### A little credit where it belongs

Sara Note uses open-source components. Excalidraw's [MIT copyright and permission notice](licenses/Excalidraw-MIT.txt) is retained in the source and installed distribution. Bundled dependencies retain their applicable notices. This repository does not grant a separate blanket license for the original application code.

---

<div align="center">

Made for your everyday little things. 🌷  
**Write a thought. Sketch a possibility. Take one lovely little step.**

</div>
