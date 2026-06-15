# Release Checklist

- [ ] Read source and identify actual runtime entry.
- [ ] Make a versioned working copy.
- [ ] Implement requested change in root and mirrored `src/` files.
- [ ] Add/update tests.
- [ ] Run TypeScript lint.
- [ ] Run all Vitest tests.
- [ ] Run production build.
- [ ] Run release audit.
- [ ] Run web launch readiness.
- [ ] Run production dependency audit.
- [ ] Inspect final `dist` strings.
- [ ] Update version files and cache version.
- [ ] Build source ZIP.
- [ ] Build GitHub/Netlify prebuilt ZIP with correct root order.
- [ ] Build deployment pack.
- [ ] Report only verified results.
