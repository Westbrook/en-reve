import { type DetectorPlugin } from "@wc-toolkit/cem-generator";
import type ts from "@typescript/typescript6";
export interface LitPluginOptions {
    /** Optional semantic class selection; omission retains upstream detection. */
    isLitClass?: (node: ts.ClassDeclaration, context: Parameters<DetectorPlugin["onFile"]>[0]) => boolean;
    /** Optional external framework boundary for inherited member extraction. */
    isLitBaseClass?: (node: ts.ClassDeclaration, context: Parameters<DetectorPlugin["onFile"]>[0]) => boolean;
}
export declare function litPlugin(options?: LitPluginOptions): DetectorPlugin;

export declare function extractOwnLitClass(node: ts.ClassLikeDeclaration, context: Parameters<DetectorPlugin["onFile"]>[0]): any;
