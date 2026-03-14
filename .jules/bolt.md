# Bolt's Journal

## 2025-02-27 - Memoization for hook-driven continuous animations
**Learning:** In React components like `SubscriptionCardActive` where animations are driven by state updates on every frame (e.g., via `useAnimatedNumber`), all child components are forced to re-render continuously. This can cause significant CPU load if children compute complex paths (like `Sparkline`) or dynamic gradients (like `TrafficProgressBar`).
**Action:** When using requestAnimationFrame-based hooks for value animation in parent components, always wrap heavy, static-prop receiving children in `React.memo` to break the re-render chain and maintain 60fps.
