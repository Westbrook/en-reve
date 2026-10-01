/** Explicit platform limits, not untracked component/test exclusions. */
export const emulationLimits:Record<'forcedColors'|'touch',Record<string,string>>={
 forcedColors:{webkit:'WebKit does not emulate forced colors; native platform review remains required.'},
 touch:{firefox:'Firefox does not expose touch emulation in this Playwright configuration.'},
};
