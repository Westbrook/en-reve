# Media viewer

`en-media-viewer` composes the native modal dialog and library carousel. Supply
stable `items` keys, image sources and meaningful alternatives; `activeKey` selects
the displayed image. Author property writes are silent. `show()` and `hide()`
synchronously return the existing `ChangeOutcome`; cancel `en-change` to veto a
proposed modal or media-selection change.

## Generated content and hydration

The viewer constructs its carousel, slides, images and image-view controls on its
initial update, including while closed. An empty `items` array renders the empty
state. Closing and reopening retains the generated body and current zoom/pan
state; item replacement and active-key changes reset media state when appropriate.

For SSR, replay the same initial `open`, `items` and `activeKey` in one containing
hydration owner. Both closed and initially open viewers include their generated
body. Hydration retains the server nodes; native dialog modality begins under the
existing dialog lifecycle. Use fresh component instances for independent server
requests.

`show()` reports synchronous semantic acceptance, not image decoding or descendant
readiness. Applications needing a media-ready observation must await the viewer
and its generated descendants and the selected image's readiness separately.
