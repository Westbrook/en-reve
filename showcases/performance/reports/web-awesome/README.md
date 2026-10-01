# Web Awesome comparison evidence

This additive comparison keeps the original eight-system raw acquisitions and report rows unchanged. Web Awesome is measured with frozen En Reve and Fluent Web Components controls in a new acquisition. Historical rows can appear in explicitly labelled descriptive overviews, but are never paired with new samples by block number.

`config.json` identifies the immutable campaign IDs, frozen bundle and inventory snapshots, and connected-DOM evidence used by the report. The serial queue and its receipt are owned by `experiments/run-web-awesome.mjs`. Separate DOM/ownership runners provide 30 primary snapshots and three supplementary initial snapshots for the selected three-system panel.

After acquisition and evidence inspection, generate the standalone report and machine-readable tables from the performance project directory:

```sh
node experiments/report-web-awesome.mjs --config reports/web-awesome/config.json
```

The generator verifies scheduled sample identities, sample uniqueness, measured build fingerprints, node-category/date partitions, repeated reported census counts, and ownership totals. It retains per-metric sample coverage/distributions and input hashes in `tables.json`. Missing readings remain unavailable. A failed acquisition can be complete and still contain failures; success/failure counts remain visible.

Only after review, append or replace the dedicated supplemental section in the main report:

```sh
node experiments/report-web-awesome.mjs --config reports/web-awesome/config.json --integrate
```

This operation edits only the `BEGIN WEB AWESOME` / `END WEB AWESOME` section. It refuses incomplete performance acquisitions. It does not rebuild fixtures, run browser tests, or alter any raw measurement. Rebuild and verify the En Reve HTML reader after integration. The independent progress report retains review status separately.

The evidence archiver preserves new raw samples, traces, coverage, Lighthouse audit JSON, harness/collector code, fixture sources/builds and qualifications under `evidence/`, with digests in `evidence/receipt.json`. Run IDs must change for any new acquisition; do not repurpose a completed directory. The inspired En Reve theme is a separate development artifact and is not substituted into a native benchmark control.
