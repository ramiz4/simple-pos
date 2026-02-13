## [1.4.1](https://github.com/ramiz4/simple-pos/compare/v1.4.0...v1.4.1) (2026-02-13)

### Bug Fixes

- **domain:** revert to local roundCurrency due to module boundary rules ([2028006](https://github.com/ramiz4/simple-pos/commit/2028006bf868a126ca902a7a6d0093af29415aa9))
- **pos:** resolve UI issues with badge text and decimal precision ([04eade8](https://github.com/ramiz4/simple-pos/commit/04eade859a23256a8936072219312d0519a3f219))

# [1.4.0](https://github.com/ramiz4/simple-pos/compare/v1.3.0...v1.4.0) (2026-02-13)

### Bug Fixes

- **deps:** make test:ci resilient to missing base branch and env ([c1b75a9](https://github.com/ramiz4/simple-pos/commit/c1b75a904b0e255f4b06bf21e2330b28823a466b))

### Features

- **shared-types:** move base repository interface to shared types ([29f88e7](https://github.com/ramiz4/simple-pos/commit/29f88e7d010e23e4be94682ee0ed13f108319cc4))

# [1.3.0](https://github.com/ramiz4/simple-pos/compare/v1.2.0...v1.3.0) (2026-02-13)

### Features

- **pos:** enhance kitchen order display with formatted date and order type ([b4bebbd](https://github.com/ramiz4/simple-pos/commit/b4bebbda81f68bbe0be9c7edd909ac63bfeef9d6))

# [1.2.0](https://github.com/ramiz4/simple-pos/compare/v1.1.3...v1.2.0) (2026-02-13)

### Bug Fixes

- **pos:** update build command in project.json to include bundles option and exclude native in build:ci script ([da8604b](https://github.com/ramiz4/simple-pos/commit/da8604be14aff974132c09060bc63fe8a71ad199))
- **pos:** update build command in project.json to remove unnecessary bundles option ([6d479bc](https://github.com/ramiz4/simple-pos/commit/6d479bc74123571835dee89ac5cd1f3e48a3d25f))

### Features

- **pos:** add DI tokens and update services to use injection tokens ([4457f13](https://github.com/ramiz4/simple-pos/commit/4457f1384c3908256ae87296397ad6f1718eb05c))
- **pos:** replace repository factory with DI tokens ([26e3de4](https://github.com/ramiz4/simple-pos/commit/26e3de445bf750ac338e1b47486188d9ca507753))

## [1.1.3](https://github.com/ramiz4/simple-pos/compare/v1.1.2...v1.1.3) (2026-02-13)

### Bug Fixes

- remove duplicate task labels and update task documentation ([51fa989](https://github.com/ramiz4/simple-pos/commit/51fa989f027cce289e049b2612c88ba8785e30b9))

# 1.0.0 (2026-02-13)

### Bug Fixes

- add IndexedDB cleanup in integration tests to resolve ConstraintError ([97bd805](https://github.com/ramiz4/simple-pos/commit/97bd805e519b6009db441f0eb6045e162d13f639))
- add null check for **TAURI** and test coverage for null edge case ([fc8e135](https://github.com/ramiz4/simple-pos/commit/fc8e135efea088ca2fcd0ed112954d8ba4dcbc1b))
- add timeout and onblocked handler to retry logic, centralize DB name constant ([4f4a3ff](https://github.com/ramiz4/simple-pos/commit/4f4a3ffcf453daacdf21d86964a9ba8886d36609))
- address code review feedback - improve ARIA roles, focus management, and keyboard support ([e73abfb](https://github.com/ramiz4/simple-pos/commit/e73abfb00389f0a724ab81c647054e485480ce79))
- address code review feedback - sanitize PIN, fix rate limiting, add accessibility ([f30bc15](https://github.com/ramiz4/simple-pos/commit/f30bc1576e1a03d9ad20ae047eb8dece3f4ed38d))
- address code review feedback and improve PIN strength calculation ([e8489b8](https://github.com/ramiz4/simple-pos/commit/e8489b8d84995869b052ea96bc4e1fc341f726dd))
- address code review feedback for payment component ([4babd32](https://github.com/ramiz4/simple-pos/commit/4babd325c260e77ce24015d7a0ca4096d4d55953))
- address code review feedback on validation, type safety, and code quality ([b7a7398](https://github.com/ramiz4/simple-pos/commit/b7a7398c417f6a882c7470c8e833d70577b147b4))
- address PR review feedback - update commands to use pnpm, fix unused variables, mark baseline metrics as historical ([c64f1db](https://github.com/ramiz4/simple-pos/commit/c64f1dbdc144c8995a0896ab262bb88535d1f5d4))
- adjust max-width of setup description paragraph for better responsiveness ([0672b77](https://github.com/ramiz4/simple-pos/commit/0672b77090b77a105cc8143e2bc0b7a2931c7b7a))
- **admin:** adjust shell layout to prevent content overlap with fixed sidebar ([55fecfc](https://github.com/ramiz4/simple-pos/commit/55fecfcd827b87c01a6a4f1e388a525df5055c1d))
- **api,pos:** address PR review feedback on sync implementation ([#74](https://github.com/ramiz4/simple-pos/issues/74)) ([8714cad](https://github.com/ramiz4/simple-pos/commit/8714cad36d276cc4431b6e20a0dba155eff31ef6))
- **api:** address PR review feedback - fix dependencies, config files, and type safety ([2cb7914](https://github.com/ramiz4/simple-pos/commit/2cb79149cd9ac6e124727f2f3db0c7cc1c2525a3))
- **api:** force row-level security for all protected tables ([e35095f](https://github.com/ramiz4/simple-pos/commit/e35095f93d777d497b4943fcf66dc83c43315457))
- **api:** remove duplicate word in e2e setup comment ([9d035d3](https://github.com/ramiz4/simple-pos/commit/9d035d3e953f1f39e5879aeb221e61ab917676d7))
- **api:** resolve build and lint errors in sync module and workspace ([988803b](https://github.com/ramiz4/simple-pos/commit/988803b789d1264814dad4d99dc9b6d281a820fb))
- **auth:** address security and validation issues in auth service ([3ae48c9](https://github.com/ramiz4/simple-pos/commit/3ae48c93f52407de3e714985af25005e4901b12b))
- center modal vertically on mobile screens ([0b415a5](https://github.com/ramiz4/simple-pos/commit/0b415a5d2dc83001523bf26c6f01ced1f87ce44f))
- **ci:** match pnpm version with package.json (10.28.2) ([e4a49bd](https://github.com/ramiz4/simple-pos/commit/e4a49bdcc1e36770236573dfb9e88c95fc2c88d1))
- **ci:** remove redundant tauri artifact upload step ([563a187](https://github.com/ramiz4/simple-pos/commit/563a187446faeed98c335973b0ae53422bd46a04))
- **ci:** setup pnpm before node to fix PATH issue ([571ee43](https://github.com/ramiz4/simple-pos/commit/571ee43e67f0ea3b8026ab8f0d839c1b670b25e6))
- clarify username field is for login, not full name ([2d93a8d](https://github.com/ramiz4/simple-pos/commit/2d93a8d8188d20c8b05736ba448a0faa351e2cec))
- clean up code formatting and improve user modal behavior ([c7cf60f](https://github.com/ramiz4/simple-pos/commit/c7cf60fbaba73e43b971599e3a1df3f1708208ea))
- correct agent examples to match actual codebase patterns ([9555b0e](https://github.com/ramiz4/simple-pos/commit/9555b0e068af928d54e6800d2652b518627c6787))
- correct padding to match header height (pt-16 instead of pt-20) ([fc734c2](https://github.com/ramiz4/simple-pos/commit/fc734c223eb5133de63b110e8a3addc080e434d1))
- **deploy,api:** change Helm image tags to versioned and stateless OAuth state ([aa51d55](https://github.com/ramiz4/simple-pos/commit/aa51d550105ab97fb94812ffa9f1358eb69a5e58))
- **deploy,api:** enforce security requirements for SAML and domain verification ([1f7d94f](https://github.com/ramiz4/simple-pos/commit/1f7d94f72893191c272e1142167440cc373765ad))
- **deps:** remove duplicate code in update-project-version.js ([b3f9d8d](https://github.com/ramiz4/simple-pos/commit/b3f9d8d40a8661f211cea39da92ffbed80a6e534))
- ensure portal and lock buttons are visible in mobile sidebar ([99ab4cf](https://github.com/ramiz4/simple-pos/commit/99ab4cf673c674c1daf842ee5ffda6484ca05850))
- **guards:** update navigation guards for setup and auth flows ([2f82f05](https://github.com/ramiz4/simple-pos/commit/2f82f050709e08b64236d66c91310c107b1fa796))
- improve database deletion retry logic for blocked connections ([d6bd46b](https://github.com/ramiz4/simple-pos/commit/d6bd46bb03bf4118e3b48f5a7e2290441ae20bb4))
- improve input sanitization security and address CodeQL alerts ([a5a6e69](https://github.com/ramiz4/simple-pos/commit/a5a6e69e00dd75dd659a65b220e8c23d3a9713d2))
- **indexeddb:** handle VersionError by auto-resetting database ([170a7d3](https://github.com/ramiz4/simple-pos/commit/170a7d3d1a1d2dcd1d0cf676412c08cee9ce793a))
- **logging:** improve logger service and error handling ([1130272](https://github.com/ramiz4/simple-pos/commit/1130272f58d862e1ac86d8fa28f045d92dd66015))
- make admin header always visible on mobile by using fixed positioning ([ac2e3ad](https://github.com/ramiz4/simple-pos/commit/ac2e3adc074557fe9f94e0712d721ed2182b36c1))
- make admin header sticky with glass effect when scrolling ([bb98a36](https://github.com/ramiz4/simple-pos/commit/bb98a36e35484e65b172b8b7a02a559ab2d7e9e7))
- miscellaneous UI fixes and role access improvements ([e1040a1](https://github.com/ramiz4/simple-pos/commit/e1040a1ed2ab3ea53051ad274739165bddc61d6f))
- **native:** add --no-install flag to npx for hermetic builds ([48c8499](https://github.com/ramiz4/simple-pos/commit/48c8499d9393c4ef4a44cc1472c54ca21318edae))
- **native:** synchronize project versioning and update API configuration ([7a879b9](https://github.com/ramiz4/simple-pos/commit/7a879b92b910e1b1347f716096987b20c6ee9d2c))
- **native:** use npx to run nx commands in tauri config ([6731986](https://github.com/ramiz4/simple-pos/commit/6731986d5dbe71348d7c5735fa214a90b09775f7))
- **pos,deploy:** revert button svg selector and remove invalid prisma flag ([d59fb2f](https://github.com/ramiz4/simple-pos/commit/d59fb2f146c02c3b4856775116541eed62a11a69))
- **pos,native:** resolve CI failures - suppress stderr, fix bundle targets, add artifact upload ([69de83f](https://github.com/ramiz4/simple-pos/commit/69de83fa19b1ffe122fb565e2349ff0e67643150))
- **pos:** correct Tailwind classes and PWA meta tags ([1b19144](https://github.com/ramiz4/simple-pos/commit/1b19144965dff3b63b24eabefc5dcd55b29a3784))
- **pos:** resolve api and pos dev serve regressions ([04eeac6](https://github.com/ramiz4/simple-pos/commit/04eeac6402e89258bf7995e53baf4d061326a1d0))
- **pos:** resolve table status inconsistencies and improve cart workflow ([37bc2a7](https://github.com/ramiz4/simple-pos/commit/37bc2a7bcbdf787d789bb1755f549c53c0c4d451))
- **pos:** resolve tView crash and high CPU in Tauri environment ([121613d](https://github.com/ramiz4/simple-pos/commit/121613d748df728d65d3a72e3f4f684e01007208))
- **pos:** stabilize domain extraction and API order compatibility ([c371221](https://github.com/ramiz4/simple-pos/commit/c37122157a1ed8a1a5e1e9882c2065de75a644cf))
- remove redundant ARIA labels per code review feedback ([df07c86](https://github.com/ramiz4/simple-pos/commit/df07c860d9f6c19415e4d546f649b0205af991a8))
- remove superfluous arguments from desktopLandingGuard test calls ([a70adaf](https://github.com/ramiz4/simple-pos/commit/a70adafe27ed7aeaafb122a422745a61efa8b232))
- **routing:** resolve memory leak and initial load state in AdminShell ([35c11c0](https://github.com/ramiz4/simple-pos/commit/35c11c094aa1c49c64da685814cfd8caa628f887))
- **setup:** logic to prevent repeated setup ([b56b932](https://github.com/ramiz4/simple-pos/commit/b56b93242a813712b197f22b12d27186bab357c0))
- **sso:** add JWT validation for malformed OAuth state payload ([d9ab890](https://github.com/ramiz4/simple-pos/commit/d9ab890de266d38a507bb27843957420e5dcdccf))
- **ui:** display table name/number instead of ID in Active Orders ([9a304e6](https://github.com/ramiz4/simple-pos/commit/9a304e661b1502db334762633e9c51528bf18f92))
- **ui:** resolve navigation and binding issues ([6ecb4a7](https://github.com/ramiz4/simple-pos/commit/6ecb4a7e2181f9d78dae116eedeef4967fb48f9d))
- update remaining npm references to pnpm in SQLITE_TESTS_QUICK_REFERENCE.md ([c0ca184](https://github.com/ramiz4/simple-pos/commit/c0ca184b0d709c64f3801cdb6aa09e4ce982dbae))
- use Angular router for register link to fix GitHub Pages navigation ([ef5d917](https://github.com/ramiz4/simple-pos/commit/ef5d917ec6b3cdf0077770e0b9bd26b4f825c5e6))
- use h-dvh instead of h-screen for iOS Safari sidebar visibility ([22e8569](https://github.com/ramiz4/simple-pos/commit/22e856945af0ef8cc4de521a2c54d4358a5b22e2))
- validate amount received before payment and clean up legacy tip storage ([164f197](https://github.com/ramiz4/simple-pos/commit/164f197b0a1df113a9db0d2d6a99b559bedf4aac))

### Features

- add 'Total plus Tip' field with validation and override support ([6e57bae](https://github.com/ramiz4/simple-pos/commit/6e57baedf609a2fdf824061c20c40272f40c8e8b))
- Add `db:reset` script to delete application database files. ([22b1dea](https://github.com/ramiz4/simple-pos/commit/22b1dead8ba3d1ed22bc37abc336ee90a37cd281))
- add comprehensive test coverage and improve platform detection ([0cb5c17](https://github.com/ramiz4/simple-pos/commit/0cb5c17f6ebe746c5b9ca6f3699a567ec6496cf3))
- add custom agent profiles for specialized development tasks ([d7ff3cd](https://github.com/ramiz4/simple-pos/commit/d7ff3cd287070937019b758e26613c4dda3ead50))
- Add domain extraction plan and Redis integration verification tasks ([f4abb90](https://github.com/ramiz4/simple-pos/commit/f4abb9022c5475be183a57fb9a7b2b51d1f348b9))
- add Phase 2 accessibility improvements (navigation, skip links, focus styles) ([45495cb](https://github.com/ramiz4/simple-pos/commit/45495cb279c78c1377a7a3dca4ef49b18a18468f))
- add security improvements and enhanced UX for authentication ([34bbe39](https://github.com/ramiz4/simple-pos/commit/34bbe39cc345ae0529dc858a4d9463bbd54c2b2c))
- Add Tauri desktop integration and Auto-updater ([76d8fb2](https://github.com/ramiz4/simple-pos/commit/76d8fb203ec17b76feae10f1cdc14505d9a84368))
- Add unit tests for `OrderService.updateOrder` and integration tests for order tip and total calculations. ([3cd2a5f](https://github.com/ramiz4/simple-pos/commit/3cd2a5f5a56faa9e1c7bee6e14e2d302909a3b98))
- Adjust payment page layout and typography for a more compact design ([8a5a6f3](https://github.com/ramiz4/simple-pos/commit/8a5a6f328a0770e771c5c7585b3b5d6261ad3d47))
- **admin:** add new sidebar components for admin navigation ([e8eb62e](https://github.com/ramiz4/simple-pos/commit/e8eb62e6f549b6d1b540aa61036babfc5652edb0))
- **admin:** add quick navigation menu to secondary header ([ad94a59](https://github.com/ramiz4/simple-pos/commit/ad94a59eacdc74155aac1b82b6814cc65fec6744))
- **admin:** overhaul backup settings UI with glassmorphism and tailwind ([8ec80d1](https://github.com/ramiz4/simple-pos/commit/8ec80d1b3e4297e34ef8e1234b26e3ecab6a33cc))
- **admin:** refactor admin header and enhance dashboard navigation ([5c22d8d](https://github.com/ramiz4/simple-pos/commit/5c22d8d230b69b59aaada270f0388f202bb5cee4))
- **admin:** refactor management pages with reusable components (Phase 2) ([5292dce](https://github.com/ramiz4/simple-pos/commit/5292dce3d4b3cb825defa5a52b67c9a9b7c3426a))
- **api:** add postgres rls and prisma v7 config ([d8c9cc2](https://github.com/ramiz4/simple-pos/commit/d8c9cc20e50f493fcc0123616008cb30f7a5f43b))
- **api:** implement JWT authentication system ([#66](https://github.com/ramiz4/simple-pos/issues/66)) ([ec2b22e](https://github.com/ramiz4/simple-pos/commit/ec2b22e5af812e873a06270e072e81ec2d293085))
- **api:** implement multi-tenancy foundation with postgres RLS ([eeaf2ed](https://github.com/ramiz4/simple-pos/commit/eeaf2ed85f2659d67b0a5ca1434d0fa8fab05941))
- **api:** implement phase 3 saas platform ([6f671ad](https://github.com/ramiz4/simple-pos/commit/6f671ad72cb5f9a248a1f1bc532f3e20d31bdc18))
- **api:** initialize NestJS backend application with Nx ([e41aef7](https://github.com/ramiz4/simple-pos/commit/e41aef746c158b91085ea68e2442d91e8dcc137a))
- **api:** validate tenant UUID in withRls to prevent database errors ([47782ca](https://github.com/ramiz4/simple-pos/commit/47782ca303e967259706290b3bceb1a76ff13ab4))
- **auth:** improve staff selection with pin verification ([f19e57d](https://github.com/ramiz4/simple-pos/commit/f19e57d95d16ceb292893630ba6093ce99d0b579))
- bypass landing page on desktop and start directly at login ([dfebbfb](https://github.com/ramiz4/simple-pos/commit/dfebbfb5d534f74332a7923ad5e3c3f656c97cd4))
- complete accessibility implementation with admin page improvements ([de80c09](https://github.com/ramiz4/simple-pos/commit/de80c09ed2b80d1305de713a31d847de6744ce28))
- Core POS web application with PWA support ([d630087](https://github.com/ramiz4/simple-pos/commit/d630087e490269b9a0be534ed1c0d76a7fa3762b))
- **core:** update auth and user management logic ([14c521b](https://github.com/ramiz4/simple-pos/commit/14c521ba4ce133a1782987f24744dac47f0e07eb))
- **data:** add customerName to order entity and repository support ([77e2bc9](https://github.com/ramiz4/simple-pos/commit/77e2bc95eb1aeaf426f06a7e1040b23e28f98121))
- **deploy:** add step to upload Tauri build artifacts ([b1192a1](https://github.com/ramiz4/simple-pos/commit/b1192a115eca723513192e69ffdc1103c6abf92d))
- **domain:** extract core logic and reset versioning for 1.0.0 ([a6782d4](https://github.com/ramiz4/simple-pos/commit/a6782d409b42c9782bb401438bdf6e797a79128c))
- implement Phase 1 accessibility improvements (buttons, modals, forms) ([5c9190b](https://github.com/ramiz4/simple-pos/commit/5c9190b123e0b6a5f578ad2ecdaac0114e41a429))
- **kitchen:** refine order filtering and status logic ([eb5b7c6](https://github.com/ramiz4/simple-pos/commit/eb5b7c6befe061ae2609cc7043a84e1669bf9984))
- modernize product category filter with fixed positioning and improved UX ([d78a5db](https://github.com/ramiz4/simple-pos/commit/d78a5dbd909577f0ddda8ac99e82fb153a95dc72))
- **monorepo:** transform project structure to Nx monorepo and add domain unit tests ([ff3262c](https://github.com/ramiz4/simple-pos/commit/ff3262cfdaf696428d02c93b712d6450460ee06c))
- optimize status bar and layout for mobile responsiveness and long labels ([c51c9bb](https://github.com/ramiz4/simple-pos/commit/c51c9bb2ab57b75c7c56c642e9017d2a46f7534c))
- **pos:** add AppInfoService for dynamic versioning and refactor test mocks ([bd27be7](https://github.com/ramiz4/simple-pos/commit/bd27be7b81daa5b3e33ddbd7eb7db82d203c8b71))
- **pos:** add ProductCardComponent ([b9697c4](https://github.com/ramiz4/simple-pos/commit/b9697c4b6d6533fb55ad718ffbaafcb8dfd674ec))
- **pos:** add QuantitySelectorComponent ([170ec84](https://github.com/ramiz4/simple-pos/commit/170ec84e2ac6af559678a8361744c498c5a74ae3))
- **pos:** add StatusBarComponent ([7fbf973](https://github.com/ramiz4/simple-pos/commit/7fbf973870aca0cceea38f23f14425b520919faa))
- **pos:** enhance cart and payment flow ([eac30da](https://github.com/ramiz4/simple-pos/commit/eac30da01be28dca5eea16edd9f69e5430acf9d9))
- **pos:** implement enterprise docker deployment and startup hardening ([368d08e](https://github.com/ramiz4/simple-pos/commit/368d08e8a404b4780a9418504da64ccc973eeb20))
- **pos:** implement phase 2 sync engine and cloud integration ([c11f03c](https://github.com/ramiz4/simple-pos/commit/c11f03cbff3d377c353447a6530b89c84b52f5da))
- remove tip feature and add change calculation to payment screen ([09e3a00](https://github.com/ramiz4/simple-pos/commit/09e3a00a323f3865e66cc09c180d93b6a0f85fd7))
- **routing:** introduce Admin and POS feature shells and domain-oriented route definitions ([5323cb0](https://github.com/ramiz4/simple-pos/commit/5323cb07bd3495bd53cbf99e0501663cf01f2682))
- **ui:** implement active orders page ([4acf3fc](https://github.com/ramiz4/simple-pos/commit/4acf3fc2afba87b82164fdc2115082bd549c03f5))
- **ui:** refine kitchen view and soften system-wide aesthetics ([66df6c3](https://github.com/ramiz4/simple-pos/commit/66df6c36ccdf68c3db07bce22dbb70671c89ae28))
- **users:** add user deletion functionality ([f510f2e](https://github.com/ramiz4/simple-pos/commit/f510f2e6adc5a2527514dec6b76f16157837bde9))
- **users:** implement name/email updates and improve error logging ([7e2367b](https://github.com/ramiz4/simple-pos/commit/7e2367b9e51ebad72ac7bed5fe52e5998e2835c1))

## [1.1.2](https://github.com/ramiz4/simple-pos/compare/v1.1.1...v1.1.2) (2026-02-13)

### Bug Fixes

- **ci:** remove redundant tauri artifact upload step ([563a187](https://github.com/ramiz4/simple-pos/commit/563a187446faeed98c335973b0ae53422bd46a04))

## [1.1.1](https://github.com/ramiz4/simple-pos/compare/v1.1.0...v1.1.1) (2026-02-13)

### Bug Fixes

- **pos:** stabilize domain extraction and API order compatibility ([c371221](https://github.com/ramiz4/simple-pos/commit/c37122157a1ed8a1a5e1e9882c2065de75a644cf))

# [1.1.0](https://github.com/ramiz4/simple-pos/compare/v1.0.0...v1.1.0) (2026-02-13)

### Features

- **domain:** extract core logic and reset versioning for 1.0.0 ([a6782d4](https://github.com/ramiz4/simple-pos/commit/a6782d409b42c9782bb401438bdf6e797a79128c))

# Changelog

All notable changes to this project will be documented in this file.
