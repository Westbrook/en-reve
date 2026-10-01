# En Reve consumer experiments

Five samples per load/cache cell. Sequential exploratory campaigns with native controls before and after; variants were not randomized together. No causal speedup or confidence claim follows from these small medians. Native controls reveal session drift. Separate interaction pilots test first-use cost and scroll/CLS displacement.
The first lazy/intent command semantic and frame timings were invalidated because the collector accepted an unregistered element. Those cells are omitted here; raw runs and the invalidation receipt remain available. Replacement v2 runs use the corrected collector.

| Run / variant | Suite | Cache | n / failures | LCP ms | CLS | Scripted INP ms | First commands semantic ms |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| experiment-containment-v1 / content-visibility | load | warm | 5 / 0 | 260.0 | 0.0000 | — | — |
| experiment-containment-v1 / content-visibility | load | cold | 5 / 0 | 560.0 | 0.0000 | — | — |
| experiment-content-visibility-interaction-v1 / content-visibility | interactions | cold | 3 / 0 | 580.0 | 0.0000 | 48.0 | 21.0 |
| experiment-control-after-v1 / native | load | warm | 5 / 0 | 264.0 | 0.0000 | — | — |
| experiment-control-after-v1 / native | load | cold | 5 / 0 | 600.0 | 0.0000 | — | — |
| experiment-control-before-v1 / native | load | warm | 5 / 0 | 280.0 | 0.0000 | — | — |
| experiment-control-before-v1 / native | load | cold | 5 / 0 | 600.0 | 0.0000 | — | — |
| experiment-intent-commands-interaction-v1 / intent-commands | interactions | cold | 3 / 0 | 600.0 | 0.0000 | 48.0 | — |
| experiment-intent-commands-interaction-v2 / intent-commands | interactions | cold | 3 / 0 | 604.0 | 0.0000 | 48.0 | 152.1 |
| experiment-intent-v1 / intent-commands | load | warm | 5 / 0 | 256.0 | 0.0000 | — | — |
| experiment-intent-v1 / intent-commands | load | cold | 5 / 0 | 596.0 | 0.0000 | — | — |
| experiment-lazy-commands-interaction-v1 / lazy-commands | interactions | cold | 3 / 0 | 600.0 | 0.0000 | 48.0 | — |
| experiment-lazy-commands-interaction-v2 / lazy-commands | interactions | cold | 3 / 0 | 608.0 | 0.0000 | 56.0 | 186.8 |
| experiment-lazy-v1 / lazy-commands | load | warm | 5 / 0 | 252.0 | 0.0000 | — | — |
| experiment-lazy-v1 / lazy-commands | load | cold | 5 / 0 | 576.0 | 0.0000 | — | — |
| experiment-native-interaction-v2 / native | interactions | cold | 3 / 0 | 716.0 | 0.0000 | 56.0 | 26.6 |
| experiment-split-vendor-interaction-v1 / split-vendor | interactions | cold | 3 / 0 | 648.0 | 0.0000 | 48.0 | 24.9 |
| experiment-vendor-v1 / split-vendor | load | warm | 5 / 0 | 284.0 | 0.0000 | — | — |
| experiment-vendor-v1 / split-vendor | load | cold | 5 / 0 | 616.0 | 0.0000 | — | — |
