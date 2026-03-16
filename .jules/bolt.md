# Bolt's Journal

## 2025-02-27 - Memoization for hook-driven continuous animations
**Learning:** In React components like `SubscriptionCardActive` where animations are driven by state updates on every frame (e.g., via `useAnimatedNumber`), all child components are forced to re-render continuously. This can cause significant CPU load if children compute complex paths (like `Sparkline`) or dynamic gradients (like `TrafficProgressBar`).
**Action:** When using requestAnimationFrame-based hooks for value animation in parent components, always wrap heavy, static-prop receiving children in `React.memo` to break the re-render chain and maintain 60fps.

## 2025-03-15 - Совмещение состояния для анимаций (State Colocation)
**Learning:** Хотя мемоизация дочерних элементов (`React.memo`) полезна, когда родительский компонент должен часто перерисовываться (например, 60 кадров в секунду для анимации), еще более производительным подходом является изоляция быстро обновляющегося состояния в собственный небольшой компонент. Это предотвращает перерисовку родителя в первую очередь, таким образом предотвращая перерисовку любых немемоизированных дочерних элементов (таких как сложные DOM-деревья или компоненты, которые не могут быть легко мемоизированы) 60 раз в секунду.
**Action:** При анимации значений с помощью хуков типа `useAnimatedNumber`, извлекайте вызов хука и конкретный DOM-узел, отображающий анимированное значение, в выделенный микрокомпонент.

## 2025-03-22 - Оптимизация вычисления максимума в больших массивах (Math.max vs reduce)
**Learning:** Использование spread оператора с `Math.max(...data.map(item => item.value))` в React компонентах графиков (таких как `SimpleBarChart` и `SimpleAreaChart`) создает значительные риски производительности и стабильности. Во-первых, вызов `map()` создает промежуточный массив, увеличивая потребление памяти и нагрузку на сборщик мусора. Во-вторых, spread оператор передает все элементы массива как отдельные аргументы в функцию `Math.max()`. При больших объемах данных это гарантированно приводит к фатальной ошибке `RangeError: Maximum call stack size exceeded`, так как размер стека вызовов в JavaScript ограничен (обычно около 10 000 - 100 000 аргументов в зависимости от движка).
**Action:** Для вычисления максимального или минимального значения в массиве объектов всегда используйте метод `reduce`: `data.reduce((max, item) => Math.max(max, item.value), 0)`. Это решение работает за время O(N), не создает промежуточных массивов и безопасно для массивов любого размера, предотвращая переполнение стека вызовов.
