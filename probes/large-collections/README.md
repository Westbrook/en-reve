# Large collection contracts

After the workspace build, run:

```sh
npx tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext probes/large-collections/consumer.types.ts
node --test probes/large-collections/ssr.test.mjs
```

The consumer fixture verifies root/selective type exports, data render callbacks,
async activity request completion, native-shaped scroll options and carousel key
navigation. The server checks verify bounded initial data rendering, complete
nonvirtual reading pages, authored fallback and isolation between render requests.

Browser behavior is covered in `activity-history.spec.ts` and
`carousel-collection.spec.ts`, alongside the existing `presence-activity.spec.ts`
and `carousel.spec.ts` baselines. These tests do not claim real screen-reader or
physical mobile acceptance.
