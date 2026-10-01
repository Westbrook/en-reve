import type { DetectorPlugin } from "./types.js";
export declare function vanillaBuiltin(options?: {isClass?: (node: import("@typescript/typescript6").ClassDeclaration, context: Parameters<DetectorPlugin["onFile"]>[0]) => boolean}): DetectorPlugin;

export declare function extractOwnVanillaClass(node: import("@typescript/typescript6").ClassLikeDeclaration, context: Parameters<DetectorPlugin["onFile"]>[0]): any;
