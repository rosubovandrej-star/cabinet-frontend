# Bolt's Journal

## 2025-02-27 - Memoization for hook-driven continuous animations
**Learning:** In React components like `SubscriptionCardActive` where animations are driven by state updates on every frame (e.g., via `useAnimatedNumber`), all child components are forced to re-render continuously. This can cause significant CPU load if children compute complex paths (like `Sparkline`) or dynamic gradients (like `TrafficProgressBar`).
**Action:** When using requestAnimationFrame-based hooks for value animation in parent components, always wrap heavy, static-prop receiving children in `React.memo` to break the re-render chain and maintain 60fps.

## 2023-10-27 - Memoization for hook-driven continuous animations
**Learning:** `HoverBorderGradient` component was continuously re-rendering because it was not memoized, and it was used inside `SubscriptionCardActive` which animates continuously via `useAnimatedNumber`. This causes high CPU load, specifically on mobile devices, since it relies on CSS properties and animated rotation.
**Action:** Wrapped `HoverBorderGradient` in `React.memo` to break the re-render chain and prevent unnecessary renders when parent components animate state that doesn't change `HoverBorderGradient`'s props.
