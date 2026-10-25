# CuteNotes 1.1.1 — verification

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
