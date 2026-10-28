# Sara Note 1.4.0 — verification

## Local backups and Note History · 28 October 2026

- Twenty-six automated tests pass. Seven safety tests cover grouped automatic history, restore preserving the current version, checkpoints and per-note retention, opt-out, deleted-note recovery with missing folders, restart, atomic history/disk rollback, unchanged-backup deduplication, seven-copy rotation including equal timestamps, path validation, corruption/failure handling, the global 20 MiB snapshot budget and valid large JSON-escaped notes.
- `npm run test:safety` passes against the final packaged executable: startup creates a local backup without user action; checkpoint preview and restore preserve the current note; Settings recovers a deleted note; actual local backup restore writes a before-restore copy containing newer work and can undo the restore; drawing history previews render; versions/copies survive restart; no renderer errors occur. Native confirmations use deterministic test choices.
- The packaged executable also passes `test:organization`, `test:features`, `test:desktop` and `test:board`. The package inspection verifies the final storage and local-backup services, slim SQLite runtime, fonts and notices.
- A note preview limit of 12 MiB failed a valid seven-million-quote note because JSON escaping doubled its snapshot size. The decompression limit now covers the supported note size, and the regression passes without relaxing note validation.
- Concurrent main-process flush requests share one pending promise, avoiding competing save acknowledgements between background backup and explicit user actions.
- New storage is additive. History snapshots are compressed and limited to 30 per note, 2,000 overall and 20 MiB of retained payload. Automatic backups retain up to seven files / 200 MiB in the local `auto-backups` directory; current-notebook exports remain format 2 and exclude timeline/backup collections. Automatic jobs run while the app is open and skip unchanged content.
- Installer: 128,282,593 bytes (122.3 MiB). Screenshots and tests use isolated sample data. The interactive installer wizard and live Google authorization remain outside automated tests.

## Previous organization release: Sara Note 1.3.0

## Folders and tags · 28 October 2026

- Nineteen storage/service/updater/layer tests pass, including six organization tests: upgrading a real sample 1.2 database and restoring its version-1 backup; folder rename/restart and safe removal; tag normalization/validation; empty folders and same-name folder merging in backups; invalid references leaving the notebook unchanged; and simulated disk-write rollback.
- The legacy database/backup fixtures contain generated sample data from the released 1.2.1 storage implementation, so migration tests run without Git history or access to a user's notebook.
- `npm run test:organization` passes against the actual packaged `Sara Note.exe`: folder creation, note assignment/movement, Unicode tags, case-insensitive deduplication, combined filters, new-note filter inheritance, drawing organization, folder rename/removal preserving all notes, tag search, actual backup Replace restore, empty-folder retention, restart and a 950×720 window. No renderer errors were recorded.
- The packaged executable also passes `test:features`, `test:desktop` and `test:board`. The packaging check still confirms the slim SQLite-only Node runtime, retained fonts/notices and packaged code matching tested sources. The installer is 128,273,409 bytes (122.3 MiB).
- Database changes are additive: the original eight-column notes table is retained, with separate folders and note metadata tables. New backups use format 2; old format 1 backups remain readable. Versions before 1.3.0 reject the new backup format, preventing silent loss of folder/tag metadata on restore.
- Native file dialogs use isolated deterministic test paths. The interactive installer wizard and live Google account authorization remain outside automated checks. Installer signing status is unchanged.

## Previous size release: Sara Note 1.2.1

## Smaller installer · 27 October 2026

- Installer: 201,041,823 → 128,274,839 bytes (191.7 → 122.3 MiB), a 36.2% reduction. The bundled application archive shrank from 282,274,303 bytes to approximately 19.6 MiB.
- Frontend libraries remain in the compiled renderer; duplicate dependency sources are excluded by classifying those packages as build dependencies. SQLite remains a runtime dependency, with only `sql-wasm.js` and `sql-wasm.wasm` included from its `dist` folder. All locked dependency versions are unchanged.
- Maximum installer compression is enabled. All drawing fonts and Electron locale resources remain. Dependency license notices are collected into `licenses/DEPENDENCY-NOTICES.txt` and included in the installed resources.
- `node scripts/check-package.cjs` passes: only SQLite is installed as a Node runtime package, required SQLite files and drawing fonts are present, notices are included, and packaged main/storage/export/update sources plus the renderer entry point match the tested build.
- The actual smaller `win-unpacked/Sara Note.exe` passes `test:features`, `test:desktop` and `test:board`. Thirteen storage/service/updater/layer tests pass. The standard interactive installer wizard was not automated.

## Previous feature release: Sara Note 1.2.0

Windows x64 · 27 October 2026.

- Thirteen automated storage, Drive mock, updater and layer tests pass. Update tests verify numeric version comparison, GitHub download allowlisting, SHA-256 checks before installation, saving before installer launch, rejection of corrupt installers and offline failure. Installer launch/exit uses mocks.
- The actual Electron feature checks cover Unicode text PDF/PNG/JPEG, drawing PDF/PNG/JPEG/SVG, saved custom Ink/Fill/Paper circles, saved light themes, layer movement with bound labels and Undo, batch PDF export and a startup notice with a mocked newer release.
- The color regression compares actual canvas pixels with exported PNG pixels. Before the fix, Dark mode showed selected pink paper as RGB (36,26,29), while export produced (252,240,243). After the fix both use (252,240,243). The canvas preserves the original colors independently of the surrounding workspace theme, and exports explicitly include the paper background.
- A 60-line Unicode note produces a two-page PDF; PDF text extraction confirms the final line is present. Text images support a document height up to 16,000 pixels; longer notes receive a message recommending PDF.
- A repeated export check generates six full-length 100-line Unicode PNGs and verifies their custom background pixels. Text images use direct rasterization rather than waiting for hidden-window compositor frames. An over-height note reports the PDF alternative without writing a partial file.
- Existing desktop and custom-board regression suites pass: save/restart, sticky/task synchronization, backup restore, images, templates, embedded SVG fonts, dark workspace and a 950×720 window.
- The stable installer application ID and original data directory are retained for upgrade compatibility. Old CuteNotes backup markers are accepted; new backups use Sara Note.
- The final packaged `win-unpacked/Sara Note.exe` passes the full 1.2.0 feature suite. Its main process, export service, update service and built entry point were compared with the final local sources before running it. The NSIS installer contains this packaged application.

Commands: `npm test`, `node scripts/features120.cjs`, `node scripts/color-repro.cjs`, `npm run test:desktop`, `npm run test:board`, `npm run build`.

File dialogs use deterministic isolated paths. Screenshots contain sample data. Live Google authorization and the interactive installer wizard are outside these automated checks. Older builds cannot check for updates: install 1.2.0 once to receive future alerts. Installers remain unsigned.

## Historical verification: CuteNotes 1.1.1

Build target: Windows x64. Verified 25 October 2026.

## Readability update in 1.1.1

The custom drawing toolbar now uses 10px labels and 23px SVG icons, larger button targets and darker colors. Small navigation, task, settings and drawing labels were enlarged across the interface. A focused desktop check verified computed label/icon sizes, tool selection, a 950×720 window, scrolling for tools that do not fit, and absence of renderer errors. The checks below were completed for the preceding 1.1 drawing implementation; the readability-only update did not repeat the full suite.

## Custom whiteboard checks for 1.1

- Excalidraw's standard top/bottom interface is hidden; CuteNotes drawing controls remain visible.
- Sticky cards insert with editable bound text; custom Undo and Redo restore the entire card.
- Duplicate creates unique element IDs and remaps bound text, group IDs and arrow bindings. Deleting the duplicate preserves the original card and its label.
- Clear asks for confirmation and remains undoable.
- The flowchart template creates three nodes and two bound connectors. The mind map creates a central idea, four branches and four connectors.
- Checklist cards and star/heart stamps insert and save.
- Selected objects accept fill changes; paper color and grid preferences persist in the scene.
- The highlighter and zoom/fit controls work through the custom interface.
- Imported images persist with their binary data in the saved scene. SVG export embeds images and complete local fonts without dynamically evaluating code.
- An image that would exceed the whiteboard's save capacity is rejected before insertion, leaving the existing drawing unchanged.
- PNG export, SVG export, dark appearance and a 950×720 window were exercised.
- The completed custom-board checks reported no console errors or renderer exceptions.

Run these checks with `npm run test:board`. Their file dialogs are substituted with deterministic test paths. The existing seven service/storage tests and desktop regression suite also pass after the whiteboard changes.

## Automated storage and cloud-service tests: 7 passed

- Unicode notes, task pin/completion state and preferences survive reopening SQLite.
- Compressed backups round-trip notes, drawing scenes, sticky text/color and tasks; credentials are excluded and pre-restore recovery copies are written.
- Invalid backups leave the notebook unchanged.
- Merge and replace follow their documented behavior.
- Deleted samples do not reappear on startup.
- A simulated persistence failure rolls back in-memory changes and preserves the database on disk.
- Mocked Google API calls cover token refresh, creation in appDataFolder, updating an existing cloud backup, download, offline failure and local sign-out. This is not a live Google integration test.

## Desktop smoke checks: passed in development and the packaged executable

- Create a note, rename it, enter Sinhala text, select Python highlighting, save and favorite it.
- Create a task, open the desktop companion, complete the task in that window and observe the main window update.
- Enter sticky text and close the companion; the text is saved.
- Create an Excalidraw scene, draw a rectangle, add text, save and export PNG with local fonts.
- Export and reimport a real `.cutenote` backup through the desktop bridge (native file dialogs were substituted with deterministic test paths).
- Switch light/dark appearance.
- Close and relaunch the executable; notes, favorites, drawings, tasks and sticky text remain.
- No renderer exceptions or browser-console errors in the completed checks.

The NSIS installer build completed successfully. The packaged `win-unpacked/CuteNotes.exe` was used for the final desktop checks. The interactive installer wizard was not run as part of the automated tests. Actual Google account authorization, upload and restore remain unverified until a user supplies a Google Desktop OAuth configuration.

Commands: `npm test`, `npm run test:desktop`, `npm run build`, `electron-builder --win nsis --x64`. A dry-run of `npm ci` also passed with the committed lockfile.
