# Radio paint regression fixture

`fluent-radio.dark.json` preserves the Fluent React-default color recipe used by
the radio regression assertions, from commit `c66615b3` at
`tooling/theme-candidates/inspired/fluent.dark.json`.

The live catalogue now models the Fluent website and has different colors and
code-authored baselines. Keep this component regression's input stable so its
contrast, alias isolation, keyboard and disabled-state assertions retain their
original meaning. Current catalogue behavior is covered by the theme suites.

SHA256: `07f10a3e6870bd9e386287d98c6a15a91c247ec93b0692d0874026150465e850`.
