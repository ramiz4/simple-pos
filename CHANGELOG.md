## [1.12.1](https://github.com/ramiz4/simple-pos/compare/v1.12.0...v1.12.1) (2026-02-06)

### Bug Fixes

- center modal vertically on mobile screens ([0b415a5](https://github.com/ramiz4/simple-pos/commit/0b415a5d2dc83001523bf26c6f01ced1f87ce44f))

# [1.12.0](https://github.com/ramiz4/simple-pos/compare/v1.11.0...v1.12.0) (2026-02-06)

### Features

- **kitchen:** refine order filtering and status logic ([eb5b7c6](https://github.com/ramiz4/simple-pos/commit/eb5b7c6befe061ae2609cc7043a84e1669bf9984))

# [1.11.0](https://github.com/ramiz4/simple-pos/compare/v1.10.0...v1.11.0) (2026-02-05)

### Features

- modernize product category filter with fixed positioning and improved UX ([d78a5db](https://github.com/ramiz4/simple-pos/commit/d78a5dbd909577f0ddda8ac99e82fb153a95dc72))

# [1.10.0](https://github.com/ramiz4/simple-pos/compare/v1.9.1...v1.10.0) (2026-02-05)

### Features

- **admin:** overhaul backup settings UI with glassmorphism and tailwind ([8ec80d1](https://github.com/ramiz4/simple-pos/commit/8ec80d1b3e4297e34ef8e1234b26e3ecab6a33cc))

## [1.9.1](https://github.com/ramiz4/simple-pos/compare/v1.9.0...v1.9.1) (2026-02-05)

### Bug Fixes

- **admin:** adjust shell layout to prevent content overlap with fixed sidebar ([55fecfc](https://github.com/ramiz4/simple-pos/commit/55fecfcd827b87c01a6a4f1e388a525df5055c1d))

# [1.9.0](https://github.com/ramiz4/simple-pos/compare/v1.8.0...v1.9.0) (2026-02-05)

### Features

- **admin:** add new sidebar components for admin navigation ([e8eb62e](https://github.com/ramiz4/simple-pos/commit/e8eb62e6f549b6d1b540aa61036babfc5652edb0))

# [1.8.0](https://github.com/ramiz4/simple-pos/compare/v1.7.0...v1.8.0) (2026-02-05)

### Bug Fixes

- **routing:** resolve memory leak and initial load state in AdminShell ([35c11c0](https://github.com/ramiz4/simple-pos/commit/35c11c094aa1c49c64da685814cfd8caa628f887))
- **ui:** display table name/number instead of ID in Active Orders ([9a304e6](https://github.com/ramiz4/simple-pos/commit/9a304e661b1502db334762633e9c51528bf18f92))

### Features

- **routing:** introduce Admin and POS feature shells and domain-oriented route definitions ([5323cb0](https://github.com/ramiz4/simple-pos/commit/5323cb07bd3495bd53cbf99e0501663cf01f2682))

# [1.7.0](https://github.com/ramiz4/simple-pos/compare/v1.6.0...v1.7.0) (2026-02-05)

### Bug Fixes

- **ui:** resolve navigation and binding issues ([6ecb4a7](https://github.com/ramiz4/simple-pos/commit/6ecb4a7e2181f9d78dae116eedeef4967fb48f9d))

### Features

- **data:** add customerName to order entity and repository support ([77e2bc9](https://github.com/ramiz4/simple-pos/commit/77e2bc95eb1aeaf426f06a7e1040b23e28f98121))
- **pos:** enhance cart and payment flow ([eac30da](https://github.com/ramiz4/simple-pos/commit/eac30da01be28dca5eea16edd9f69e5430acf9d9))
- **ui:** implement active orders page ([4acf3fc](https://github.com/ramiz4/simple-pos/commit/4acf3fc2afba87b82164fdc2115082bd549c03f5))

# [1.6.0](https://github.com/ramiz4/simple-pos/compare/v1.5.0...v1.6.0) (2026-02-05)

### Bug Fixes

- address code review feedback on validation, type safety, and code quality ([b7a7398](https://github.com/ramiz4/simple-pos/commit/b7a7398c417f6a882c7470c8e833d70577b147b4))
- **pos:** resolve table status inconsistencies and improve cart workflow ([37bc2a7](https://github.com/ramiz4/simple-pos/commit/37bc2a7bcbdf787d789bb1755f549c53c0c4d451))

### Features

- **ui:** refine kitchen view and soften system-wide aesthetics ([66df6c3](https://github.com/ramiz4/simple-pos/commit/66df6c36ccdf68c3db07bce22dbb70671c89ae28))

# [1.5.0](https://github.com/ramiz4/simple-pos/compare/v1.4.0...v1.5.0) (2026-02-05)

### Bug Fixes

- miscellaneous UI fixes and role access improvements ([e1040a1](https://github.com/ramiz4/simple-pos/commit/e1040a1ed2ab3ea53051ad274739165bddc61d6f))

### Features

- **admin:** add quick navigation menu to secondary header ([ad94a59](https://github.com/ramiz4/simple-pos/commit/ad94a59eacdc74155aac1b82b6814cc65fec6744))
- **admin:** refactor admin header and enhance dashboard navigation ([5c22d8d](https://github.com/ramiz4/simple-pos/commit/5c22d8d230b69b59aaada270f0388f202bb5cee4))
- **admin:** refactor management pages with reusable components (Phase 2) ([5292dce](https://github.com/ramiz4/simple-pos/commit/5292dce3d4b3cb825defa5a52b67c9a9b7c3426a))
- **pos:** add ProductCardComponent ([b9697c4](https://github.com/ramiz4/simple-pos/commit/b9697c4b6d6533fb55ad718ffbaafcb8dfd674ec))
- **pos:** add QuantitySelectorComponent ([170ec84](https://github.com/ramiz4/simple-pos/commit/170ec84e2ac6af559678a8361744c498c5a74ae3))
- **pos:** add StatusBarComponent ([7fbf973](https://github.com/ramiz4/simple-pos/commit/7fbf973870aca0cceea38f23f14425b520919faa))

# [1.4.0](https://github.com/ramiz4/simple-pos/compare/v1.3.0...v1.4.0) (2026-02-04)

### Bug Fixes

- **auth:** address security and validation issues in auth service ([3ae48c9](https://github.com/ramiz4/simple-pos/commit/3ae48c93f52407de3e714985af25005e4901b12b))
- **guards:** update navigation guards for setup and auth flows ([2f82f05](https://github.com/ramiz4/simple-pos/commit/2f82f050709e08b64236d66c91310c107b1fa796))
- **indexeddb:** handle VersionError by auto-resetting database ([170a7d3](https://github.com/ramiz4/simple-pos/commit/170a7d3d1a1d2dcd1d0cf676412c08cee9ce793a))
- **logging:** improve logger service and error handling ([1130272](https://github.com/ramiz4/simple-pos/commit/1130272f58d862e1ac86d8fa28f045d92dd66015))
- **setup:** logic to prevent repeated setup ([b56b932](https://github.com/ramiz4/simple-pos/commit/b56b93242a813712b197f22b12d27186bab357c0))

### Features

- Add `db:reset` script to delete application database files. ([22b1dea](https://github.com/ramiz4/simple-pos/commit/22b1dead8ba3d1ed22bc37abc336ee90a37cd281))
- **auth:** improve staff selection with pin verification ([f19e57d](https://github.com/ramiz4/simple-pos/commit/f19e57d95d16ceb292893630ba6093ce99d0b579))
- **core:** update auth and user management logic ([14c521b](https://github.com/ramiz4/simple-pos/commit/14c521ba4ce133a1782987f24744dac47f0e07eb))
- **users:** add user deletion functionality ([f510f2e](https://github.com/ramiz4/simple-pos/commit/f510f2e6adc5a2527514dec6b76f16157837bde9))
- **users:** implement name/email updates and improve error logging ([7e2367b](https://github.com/ramiz4/simple-pos/commit/7e2367b9e51ebad72ac7bed5fe52e5998e2835c1))

# [1.3.0](https://github.com/ramiz4/simple-pos/compare/v1.2.0...v1.3.0) (2026-02-04)

### Bug Fixes

- add null check for **TAURI** and test coverage for null edge case ([fc8e135](https://github.com/ramiz4/simple-pos/commit/fc8e135efea088ca2fcd0ed112954d8ba4dcbc1b))
- remove superfluous arguments from desktopLandingGuard test calls ([a70adaf](https://github.com/ramiz4/simple-pos/commit/a70adafe27ed7aeaafb122a422745a61efa8b232))

### Features

- add comprehensive test coverage and improve platform detection ([0cb5c17](https://github.com/ramiz4/simple-pos/commit/0cb5c17f6ebe746c5b9ca6f3699a567ec6496cf3))
- bypass landing page on desktop and start directly at login ([dfebbfb](https://github.com/ramiz4/simple-pos/commit/dfebbfb5d534f74332a7923ad5e3c3f656c97cd4))

# [1.2.0](https://github.com/ramiz4/simple-pos/compare/v1.1.0...v1.2.0) (2026-02-02)

### Bug Fixes

- correct agent examples to match actual codebase patterns ([9555b0e](https://github.com/ramiz4/simple-pos/commit/9555b0e068af928d54e6800d2652b518627c6787))

### Features

- add custom agent profiles for specialized development tasks ([d7ff3cd](https://github.com/ramiz4/simple-pos/commit/d7ff3cd287070937019b758e26613c4dda3ead50))

# [1.1.0](https://github.com/ramiz4/simple-pos/compare/v1.0.0...v1.1.0) (2026-02-02)

### Bug Fixes

- address code review feedback - sanitize PIN, fix rate limiting, add accessibility ([f30bc15](https://github.com/ramiz4/simple-pos/commit/f30bc1576e1a03d9ad20ae047eb8dece3f4ed38d))
- address code review feedback and improve PIN strength calculation ([e8489b8](https://github.com/ramiz4/simple-pos/commit/e8489b8d84995869b052ea96bc4e1fc341f726dd))
- clarify username field is for login, not full name ([2d93a8d](https://github.com/ramiz4/simple-pos/commit/2d93a8d8188d20c8b05736ba448a0faa351e2cec))
- improve input sanitization security and address CodeQL alerts ([a5a6e69](https://github.com/ramiz4/simple-pos/commit/a5a6e69e00dd75dd659a65b220e8c23d3a9713d2))
- use Angular router for register link to fix GitHub Pages navigation ([ef5d917](https://github.com/ramiz4/simple-pos/commit/ef5d917ec6b3cdf0077770e0b9bd26b4f825c5e6))

### Features

- add security improvements and enhanced UX for authentication ([34bbe39](https://github.com/ramiz4/simple-pos/commit/34bbe39cc345ae0529dc858a4d9463bbd54c2b2c))

# 1.0.0 (2026-02-02)

### Features

- Add Tauri desktop integration and Auto-updater ([76d8fb2](https://github.com/ramiz4/simple-pos/commit/76d8fb203ec17b76feae10f1cdc14505d9a84368))
- Core POS web application with PWA support ([d630087](https://github.com/ramiz4/simple-pos/commit/d630087e490269b9a0be534ed1c0d76a7fa3762b))

# [1.1.0](https://github.com/ramiz4/simple-pos/compare/v1.0.0...v1.1.0) (2026-02-02)

### Bug Fixes

- remove signing key password from workflow and docs ([f4fc32e](https://github.com/ramiz4/simple-pos/commit/f4fc32e7cd6e1ba25883b372e9be2226dfa2b30a))

### Features

- Add full PWA support with offline caching and branding ([64b3329](https://github.com/ramiz4/simple-pos/commit/64b33292169212550474d37ebd9cb2cfba279709))

# 1.0.0 (2026-02-02)

### Features

- Add Tauri desktop integration ([746a580](https://github.com/ramiz4/simple-pos/commit/746a58060027c02cc732986c134fe97a0815aad4))
- Implement POS web application with core features ([6e972ff](https://github.com/ramiz4/simple-pos/commit/6e972ff67f7311f8a7b2437ec865e02c58c35e73))

# 1.0.0 (2026-02-02)

### Bug Fixes

- **ci:** match deploy workflow with sigil-app for binary releases ([b833906](https://github.com/ramiz4/simple-pos/commit/b833906c2abc28862204db94e3f3aeab7b0c48c3))

### Features

- branding, tauri integration, multi-tenancy and release infrastructure ([12c0ebe](https://github.com/ramiz4/simple-pos/commit/12c0ebe6fafc005b8c6e2e7d97b08a7438d869b8))
- core architecture, POS logic and app configuration ([ef54309](https://github.com/ramiz4/simple-pos/commit/ef54309d5d0fe74b87c971df599d0cc1c68c2b11))
- management, reporting, and ESC/POS printing ([8691029](https://github.com/ramiz4/simple-pos/commit/86910291ffddd0a5c9ff873547835500883009bc))
- security, encrypted backups, and production hardening ([afd64a8](https://github.com/ramiz4/simple-pos/commit/afd64a8f94ab2bc00ccc799888ea9301b77661fa))

# 1.0.0 (2026-02-02)

### Features

- branding, tauri integration, multi-tenancy and release infrastructure ([12c0ebe](https://github.com/ramiz4/simple-pos/commit/12c0ebe6fafc005b8c6e2e7d97b08a7438d869b8))
- core architecture, POS logic and app configuration ([ef54309](https://github.com/ramiz4/simple-pos/commit/ef54309d5d0fe74b87c971df599d0cc1c68c2b11))
- management, reporting, and ESC/POS printing ([8691029](https://github.com/ramiz4/simple-pos/commit/86910291ffddd0a5c9ff873547835500883009bc))
- security, encrypted backups, and production hardening ([afd64a8](https://github.com/ramiz4/simple-pos/commit/afd64a8f94ab2bc00ccc799888ea9301b77661fa))

# [1.1.0](https://github.com/ramiz4/simple-pos/compare/v1.0.0...v1.1.0) (2026-02-02)

### Features

- add comprehensive landing page and update routes ([5735aff](https://github.com/ramiz4/simple-pos/commit/5735aff09550e32882832ed90cec3cc54f897fd4))

# 1.0.0 (2026-02-02)

### Bug Fixes

- change default route to login page for production ([de0c7f2](https://github.com/ramiz4/simple-pos/commit/de0c7f22251d24ca1fcd536cd6f61a239be4cc30))

### Features

- add automated semantic releases ([a87a260](https://github.com/ramiz4/simple-pos/commit/a87a26069a09b25f87750ceb4c754e5f30be7d19))
- Add explicit cursor styles for interactive elements and adjust the z-index of table status indicators. ([2bc6e92](https://github.com/ramiz4/simple-pos/commit/2bc6e92e8cfd48dc62cea81e5cc9784515eb6c54))
- Add multi-platform application icons, implement Tauri signing, and integrate logging and global error handling. ([e2e61cb](https://github.com/ramiz4/simple-pos/commit/e2e61cb39f249233f76b320bb05e54983a41e267))
- add product selection component with cart functionality ([b697377](https://github.com/ramiz4/simple-pos/commit/b6973774efd3cc2bd1c258521e0be5b9c0646d30))
- Adjust backup validation to skip required table checks for encrypted backups, remove printer settings UI hint, and update crypto mock to use `globalThis`. ([5b5199e](https://github.com/ramiz4/simple-pos/commit/5b5199e233ca65b993297666e3c63cdf71ce95fc))
- Conditionally render the system overview section for admin users and update minor Tailwind CSS class syntax. ([0d4e444](https://github.com/ramiz4/simple-pos/commit/0d4e44466399e2235867e744bd5e73e56b69bd57))
- implement encrypted backup and restore system with web crypto api ([55e3c61](https://github.com/ramiz4/simple-pos/commit/55e3c6143f09527c23d7cb108c756bd2ad611944))
- implement native ESC/POS printing via Tauri with network printer support and refined templates ([199948b](https://github.com/ramiz4/simple-pos/commit/199948b001e9803778fabef0b9134e1853aabe0a))
- implement production hardening with error monitoring, automated backups, and performance optimization ([548c80d](https://github.com/ramiz4/simple-pos/commit/548c80ddcf971927acbe6480a8843140ab16dfa5))
- implement table-specific cart and automated table status management ([fad73a5](https://github.com/ramiz4/simple-pos/commit/fad73a52377d42f836aaa3bc3e7b0dc415b7248a))
- Introduce SVG logo and favicon, and update branding text to "Simple POS" across components and the main HTML. ([37ad292](https://github.com/ramiz4/simple-pos/commit/37ad292bc3e73f24f2b67da9f775463e3d383c39))
- **reporting:** add unit tests and mark phase 4.2 as complete ([c603ed4](https://github.com/ramiz4/simple-pos/commit/c603ed4fb4120dfa179a2e041f37ad5d772cb3c4))
- **updater:** release workflow and update config ([a716865](https://github.com/ramiz4/simple-pos/commit/a716865fcf9ba7b284cf0f3e12b2c6c5d94cafab))
