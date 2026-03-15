1. **Understand the problem**:
   - `SubscriptionCardActive` uses `useAnimatedNumber` which causes continuous re-renders of the component during animation.
   - Child components like `HoverBorderGradient` and potentially others inside `SubscriptionCardActive` are not memoized and are re-rendered on every animation frame.
   - `Sparkline` and `TrafficProgressBar` are already memoized (`memo`).
   - Adding `React.memo` to `HoverBorderGradient` could prevent unnecessary re-renders of this complex component (which uses gradients and SVG) during the parent's `animatedPercent` changes.

2. **Check other child components**:
   - The `<Link>` and `<div className="flex-1 rounded-[14px] p-3.5...` components under "Stats row" also re-render. But extracting them just for memoization might be overkill.
   - `HoverBorderGradient` is a standalone reusable UI component in `src/components/ui/hover-border-gradient.tsx`. Memoizing it makes perfect sense.

3. **Plan**:
   - Open `src/components/ui/hover-border-gradient.tsx`.
   - Wrap `HoverBorderGradient` with `React.memo()`.
   - Ensure to import `memo` from `react` if not already imported.
   - Test if the app compiles correctly.
   - Commit the changes.
