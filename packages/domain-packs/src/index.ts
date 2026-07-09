export * from "./shared/manifest.js";
export * from "./healthcare/index.js";
export * from "./finance/index.js";
export * from "./enterprise/index.js";

import { enterprisePack } from "./enterprise/index.js";
import { financePack } from "./finance/index.js";
import { healthcarePack } from "./healthcare/index.js";

export const domainPacks = [healthcarePack, financePack, enterprisePack];
