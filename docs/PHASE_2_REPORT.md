# Phase 2 update — Number Trail / अंक यात्रा (v0.2.0)

## Implemented
Added a fourth offline puzzle based on the supplied numbered-path rules. Original deterministic boards/artwork, not imported LinkedIn levels or images. Ten levels: 4x4, 5x5 and 6x6. Checkpoints start at 1 and must be visited in order; final number is the endpoint after filling all cells. Orthogonal moves only, no revisits, and solid edge walls reject crossing. Tap cells or drag continuously; stepping backwards to the preceding cell retracts a move. Undo, restart, hint realignment, timer, clean/assisted results, personal records and family variants included. Four game cards use a two-column layout. Existing SQLite records and profiles retain their version-1 storage key.

## Level integrity and validation
Backbite rewiring generates varied Hamiltonian paths. Checkpoints sample the known valid path; walls are placed only on edges unused by it. Multiple valid solutions are accepted. Hint realigns divergent partial paths to a known solution and marks the attempt assisted. Eight automated engine tests pass, including 1,000 Number Trail level/variant boards, invalid start, bounds, overlaps, diagonal moves, wall crossing, skipped number and premature endpoint. Existing 800 path/sum variants continue to pass. TypeScript and Expo lint pass. Browser acceptance passes four clean solves including Number Trail drag, undo, profile/settings/result/feedback persistence, family turns and 320px layout. This does not certify physical Android gesture/persistence behavior.

## Native build
Android SDK 36, build tools, NDK 27.1 and Gradle 9.3.1 prepared for a standalone release-mode test APK. Build result and verification will be appended when the native task finishes. Target phone ABIs: arm64-v8a and armeabi-v7a. Test signing is for sideloaded alpha review only; production signing and Play publishing are deferred. No paid build services, ads, backend or OTP costs introduced.

## Physical-device acceptance still required
Install APK, enable airplane mode, run all games and Family Battle; restart to confirm SQLite records. Check tap/drag, wall interaction, TalkBack, and smallest/large-font phone layouts. User feedback and accessibility polishing are ongoing, so the entire Phase 2 is not claimed complete.
