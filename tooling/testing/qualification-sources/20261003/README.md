# Retained qualification inputs

These snapshots preserve exact bytes from the historical qualification receipts
listed in `manifest.json`. Current docs and test sources subsequently changed.
The support-ledger tests compare those historical receipts with these original
inputs, while fresh runs qualify the current source separately.

Seven inputs were recovered from the recorded Git objects. The generated tree
example was recovered from the preserved original checkout. Every file was
matched against its original SHA-256; no historical receipt, source hash,
outcome, limitation or manual-acceptance claim was changed. Existing snapshots
in the owning probe directories remain in use.

The resolver is limited to explicit path/digest pairs in historical tests. It
does not accept arbitrary current-source drift or turn historical passes into
current-build qualification. The owning integrity test checks every snapshot
and each cited receipt.
