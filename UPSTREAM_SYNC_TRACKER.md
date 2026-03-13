# Upstream Sync Tracker

## 2026-03-13 (cabinet-frontend)

### Applied from upstream/main
- `68e6ce1` fix: send Bearer token on email register (link to Telegram account)
- `f1102d2` fix: add purchase-options cache invalidation on balance changes
- `082471b` feat: add button reordering within rows and replace modal with inline add panel
- `5a5a987` feat: add show_in_gift toggle UI for tariffs in admin panel

### Already present in fork (empty cherry-pick, skipped)
- `45203da`, `dc740ae`, `9c7ab4b`, `78fda22`, `23aa86f`, `51ec799`, `7549ae7`, `51cc122`, `8ab740f`, `39bdf8b`, `6fd76c8`, `03c9e73`

### Deferred (conflict-heavy, requires manual adaptation)
- Large gift/account-linking/payment-return/nav/layout/release-merge series listed by `analyze_upstream_sync.sh` with `apply-check=conflict`.
- Keep policy: preserve fork modular architecture and Ultima UX.
