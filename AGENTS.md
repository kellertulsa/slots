# Agent guidance

## Application overview

- This is **The Golden Aviator**, an Angular slot-machine app.
- The application bootstraps a standalone root component from `src/main.ts`; it does not use NgModules.
- `src/app/app.ts` owns the app-level game state, hash-based machine navigation, spin flow, and timers. Keep game state and spin behavior consistent with its signal-based patterns.
- Slot-machine definitions (symbols, reels, paylines, bets, and themes) live in `src/app/slot-machine.model.ts`. Reuse this configuration rather than hard-coding machine-specific behavior in shared UI.
- Shared machine presentation and game-state types live in `src/app/slot-machine.component.ts` and its HTML template. Machine-specific components are in `src/app/slots/slot-components.ts`.
- Global styles are in `src/styles.css`; app styles are in `src/app/app.css`.

## Implementation conventions

- Use the existing Angular standalone-component patterns, strict TypeScript types, and signals for reactive state.
- Keep templates aligned with existing Angular control-flow syntax (`@if`, `@for`) and component styling conventions.
- Preserve hash navigation and machine theme behavior unless a task explicitly calls for changing them.
- Keep the game usable with keyboard and assistive technology; preserve existing labels, button states, and live announcements when changing controls or results.
- Keep changes focused. Do not add dependencies or introduce new architectural layers for small features.

## Versioning and deployment

- Before checking in application changes, increment the `version` in `package.json` using Semantic Versioning: patch for fixes, minor for backward-compatible features, or major for breaking changes. For example, run `npm version patch --no-git-tag-version`; this updates `package.json` and `package-lock.json`.
- Do not edit the generated `version.json` manually. `npm run build` and `npm run build:pages` generate it from `package.json`, and the app uses it to detect deployed updates.
- Run `npm run build:pages` before check-in to verify the Pages build and generated version metadata.

## Validation

- Run `npm run build` for application changes.
- Run `npm test` when changing or adding tests; the project currently configures Angular schematics to skip generating tests by default.
- For UI or styling changes, run the app with `npm start` and inspect it in a browser at phone, tablet/iPad, and desktop sizes. Check both portrait and landscape on phones and tablets, including representative viewports such as 320×568, 390×844, 430×932, 440×956 (iPhone Max portrait), 568×320, 844×390, 956×440 (iPhone Max landscape), 768×1024, 1024×768, 820×1180, and 1180×820.
- For short landscape phone layouts, do not rely on browser emulation alone: verify on a real iPhone in Safari when available, since browser chrome and device safe areas can reduce the usable viewport. Confirm the top of the reels and the payout row remain fully inside the cabinet; include a reduced-height landscape viewport such as 956×390 in browser checks.
- Verify the home screen and each live slot-machine screen at those sizes. Exercise data-dense states such as multiple paid paylines while the win animation cycles, and inspect dialogs and big-win overlays. Look for horizontal overflow, visible unwanted scrollbars, clipped or overlapping content, unreadable text, inaccessible controls, layout issues in reels and bet controls, and machine theme colors leaking onto the home screen after navigation. Fix issues found and recheck affected viewports before considering the change complete.
