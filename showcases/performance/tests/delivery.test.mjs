import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveryMetrics } from "../src/delivery.mjs";
const response = (type, bytes, url = "https://example.test/file") => ({
  type,
  url,
  finishedEncodedDataLength: bytes,
});
test("whole-page delivery includes HTML and fonts but excludes lifecycle collection/navigation", () => {
  const data = deliveryMetrics({
    network: [
      response("Document", 450),
      response("Script", 2000),
      response("Font", 3000),
      response("Document", 500, "https://example.test/__perf/away"),
      response("Fetch", 100, "https://example.test/__perf/collect"),
    ],
  });
  assert.equal(data.responseTransferBytes, 5450);
  assert.equal(data.htmlTransferBytes, 450);
  assert.equal(data.fontTransferBytes, 3000);
  assert.equal(data.responseCount, 3);
});
test("incomplete response never looks like a zero byte download", () => {
  const data = deliveryMetrics({
    network: [
      response("Document", 300),
      { type: "Font", url: "https://remote.test/font" },
    ],
  });
  assert.equal(data.responseTransferBytes, null);
  assert.equal(data.incompleteResponses, 1);
  assert.equal(data.partialResponseBytes, 300);
});
test("embedded SVG and blob payloads are not downloaded twice or treated as incomplete network responses", () => {
  const data = deliveryMetrics({
    networkObservation: [
      response("Document", 300),
      response("Script", 2000),
      response("Font", 800, "https://cdn.example.test/font.woff2"),
      response("Image", 50, "http://images.example.test/logo.png"),
      response("Other", 401, "data:image/svg+xml,%3Csvg%3E%3C/svg%3E"),
      response("Fetch", 1200, "blob:https://example.test/generated-image"),
      { type: "Other", url: "data:image/svg+xml,incomplete-local-response" },
      response("Fetch", 100, "https://example.test/__perf/collect"),
    ],
    collector: {
      navigation: { transferSize: 300, decodedBodySize: 500 },
      entries: { resource: [
        { name: "https://cdn.example.test/font.woff2", transferSize: 800, decodedBodySize: 800 },
        { name: "data:image/svg+xml,embedded", transferSize: 0, decodedBodySize: 401 },
        { name: "blob:https://example.test/generated-image", transferSize: 0, decodedBodySize: 1200 },
      ] },
    },
  });
  assert.equal(data.responseTransferBytes, 3150);
  assert.equal(data.partialResponseBytes, 3150);
  assert.equal(data.responseCount, 4);
  assert.equal(data.incompleteResponses, 0);
  assert.equal(data.htmlTransferBytes, 300);
  assert.equal(data.jsTransferBytes, 2000);
  assert.equal(data.fontTransferBytes, 800);
  assert.equal(data.otherTransferBytes, 50);
  assert.equal(data.nonHTTPResponseCount, 3);
  assert.equal(data.nonHTTPCompletedResponseBytes, 1601);
  assert.equal(data.nonHTTPIncompleteResponses, 1);
  assert.equal(data.timingTransferBytes, 1100);
  assert.equal(data.decodedPageBodyBytes, 1300);
});
test("only local-scheme responses cannot establish a zero-byte HTTP delivery", () => {
  const data = deliveryMetrics({ network: [response("Other", 401, "data:image/svg+xml,embedded")] });
  assert.equal(data.responseTransferBytes, null);
  assert.equal(data.responseCount, 0);
  assert.equal(data.nonHTTPCompletedResponseBytes, 401);
});
test("cache zero is preserved; pre-navigation network snapshot wins; HTML included once in resource timing", () => {
  const data = deliveryMetrics({
    networkObservation: [
      response("Document", 300),
      { ...response("Script", 0), fromDiskCache: true },
    ],
    network: [response("Document", 9999)],
    collector: {
      navigation: {
        transferSize: 459,
        encodedBodySize: 159,
        decodedBodySize: 400,
      },
      entries: {
        resource: [
          {
            name: "https://example.test/app.js",
            transferSize: 0,
            decodedBodySize: 2000,
          },
        ],
      },
    },
  });
  assert.equal(data.responseTransferBytes, 300);
  assert.equal(data.cachedResponses, 1);
  assert.equal(data.timingTransferBytes, 459);
  assert.equal(data.htmlDecodedBodyBytes, 400);
  assert.equal(data.decodedPageBodyBytes, 2400);
});
