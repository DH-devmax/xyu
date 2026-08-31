# Third-Party Notices

## Machine-readable inventory

The deterministic CycloneDX 1.6 inventory is stored in `product/sbom.cdx.json`.
`product/dependency-licenses.json` groups every inventoried component by its
declared license. Both artifacts are bound to the Go, npm and pnpm lock inputs
with SHA-256 hashes and are checked by `make supply-chain-check`.

## DH闲不下来 baseline

The product retains the v1.0.5 Ydisks-Xianyu-Helper baseline and its
Apache License 2.0 license and notices in the repository history.

## DeepSeek Harness

DeepSeek Harness is distributed under the MIT License. Its complete source,
license and generated third-party notices are retained under
`brain/vendor/deepseek-harness` after the pinned subtree is imported.

## Minimal Vite TS 7.7.0

Minimal Vite TS 7.7.0 is the licensed visual source for the adapted frontend
primitives in `frontend/src/components/minimal`, `frontend/src/layouts` and
`frontend/src/theme`. The reference archive is `minimal-vite-ts-main.zip`,
version 7.7.0, SHA-256
`b058dbc7fa8d231d06663e46d3e1d8fbfd8d38e7bd22db8abe12afa6ab498dde`.
The product uses one Minimal license for this product; demo routes, demo data,
authentication providers and unrelated assets are excluded from the build.
See the official package terms at <https://docs.minimals.cc/package/> and the
Vite integration notes at <https://docs.minimals.cc/setup/vitejs/>.
