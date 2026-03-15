# Bolt's Journal

## 2025-02-27 - Memoization for hook-driven continuous animations
**Learning:** In React components like `SubscriptionCardActive` where animations are driven by state updates on every frame (e.g., via `useAnimatedNumber`), all child components are forced to re-render continuously. This can cause significant CPU load if children compute complex paths (like `Sparkline`) or dynamic gradients (like `TrafficProgressBar`).
**Action:** When using requestAnimationFrame-based hooks for value animation in parent components, always wrap heavy, static-prop receiving children in `React.memo` to break the re-render chain and maintain 60fps.

## 2025-03-15 - Совмещение состояния для анимаций (State Colocation)
**Learning:** Хотя мемоизация дочерних элементов (`React.memo`) полезна, когда родительский компонент должен часто перерисовываться (например, 60 кадров в секунду для анимации), еще более производительным подходом является изоляция быстро обновляющегося состояния в собственный небольшой компонент. Это предотвращает перерисовку родителя в первую очередь, таким образом предотвращая перерисовку любых немемоизированных дочерних элементов (таких как сложные DOM-деревья или компоненты, которые не могут быть легко мемоизированы) 60 раз в секунду.
**Action:** При анимации значений с помощью хуков типа `useAnimatedNumber`, извлекайте вызов хука и конкретный DOM-узел, отображающий анимированное значение, в выделенный микрокомпонент.