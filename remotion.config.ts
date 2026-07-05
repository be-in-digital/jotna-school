/**
 * Remotion config — the "Pio t'explique" explainer video renderer.
 * Entry point lives in remotion/ ; assets (Pio poses) come from the app's
 * public/ folder, which is Remotion's default publicDir at the repo root.
 */
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setEntryPoint("remotion/index.ts");
