# Theme reference fonts

Locally served, unmodified variable WOFF2 fonts from their official upstream
projects. No font service is contacted at runtime. The full upstream character
sets are retained, including Latin; these files are not Latin-only subsets.

| File | CSS family | Weight range | Version | License |
| --- | --- | --- | --- | --- |
| `Figtree-Variable.woff2` | Figtree | 300–900 | 2.001 | `Figtree-OFL.txt` |
| `Geist-Variable.woff2` | Geist | 100–900 | 1.800 | `Geist-OFL.txt` |
| `GeistMono-Variable.woff2` | Geist Mono | 100–900 | 1.700 | `Geist-OFL.txt` |

All three are distributed under the SIL Open Font License, Version 1.1. Keep the
accompanying license files with redistributed copies. The filename changes do
not alter the font binaries or their internal names.

- Figtree: [official repository](https://github.com/erikdkennedy/figtree),
  commit `032dfa7fe219ef3a02890d6d3add84eacc9aebfe`, copyright 2022 The Figtree
  Project Authors.
- Geist and Geist Mono: [official repository](https://github.com/vercel/geist-font),
  commit `10dc7658f13c38a474cde201bb09a4617267545b`, copyright 2024 The Geist
  Project Authors.

`sources.json` records the exact immutable download URL, SHA-256 checksum, byte
size, and inspected metadata for each asset. FontTools verified the variable
weight axes and printable ASCII coverage in each WOFF2 file. Every requested
weight from 400 through 700 lies inside the actual font axis.

Use `font-style: normal`, the complete weight range above, and
`font-display: swap` in the consuming `@font-face` declarations.
