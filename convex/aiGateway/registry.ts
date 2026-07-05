/**
 * AI Gateway — model registry.
 *
 * MVP-1 Plan B (Decision 76 + design §4): the design lists DeepSeek-V3 but the
 * environment ships only `OPENAI_API_KEY`, so every purpose routes to OpenAI
 * `gpt-4o-mini`. Admins can swap individual purposes via `settings.modelOverrides`
 * without redeploy.
 *
 * Pure module — no Convex imports. Can run in actions or queries.
 */

export type AiPurpose =
  | "palier_base"
  | "palier_personalized"
  | "verify_short_answer"
  | "explain_mistake"
  | "verify_math";

export interface PurposeConfig {
  /** Default model id (when no override + no economy downgrade applies). */
  defaultModel: string;
  /** Output cap. Reduced by 30% in economy mode. */
  maxOutputTokens: number;
  /** Generation temperature. */
  temperature: number;
  /** Soft network timeout, ms. UX timeout (Decision 64) is enforced upstream. */
  requestTimeoutMs: number;
  /** Retry budget on 5xx / timeout. Decision §4. */
  retries: number;
  /** Cost ceilings per 1M tokens. */
  costPer1MInputUsd: number;
  costPer1MOutputUsd: number;
}

// gpt-4o-mini list price (Sept 2025): $0.15 / 1M input, $0.60 / 1M output.
const GPT_4O_MINI: Pick<PurposeConfig, "costPer1MInputUsd" | "costPer1MOutputUsd"> = {
  costPer1MInputUsd: 0.15,
  costPer1MOutputUsd: 0.6,
};

const REGISTRY: Record<AiPurpose, PurposeConfig> = {
  palier_base: {
    defaultModel: "gpt-4o-mini",
    maxOutputTokens: 6000,
    temperature: 0.7,
    requestTimeoutMs: 90_000, // 10 exos + hints + structured output = ~30-60s
    retries: 1,
    ...GPT_4O_MINI,
  },
  palier_personalized: {
    defaultModel: "gpt-4o-mini",
    maxOutputTokens: 6000,
    temperature: 0.8,
    requestTimeoutMs: 90_000,
    retries: 1,
    ...GPT_4O_MINI,
  },
  verify_short_answer: {
    defaultModel: "gpt-4o-mini",
    maxOutputTokens: 200,
    temperature: 0.0,
    requestTimeoutMs: 10_000,
    retries: 1,
    ...GPT_4O_MINI,
  },
  explain_mistake: {
    defaultModel: "gpt-4o-mini",
    // Headroom for up to 8 rich steps — comprehensibility over brevity.
    maxOutputTokens: 2000,
    temperature: 0.5,
    requestTimeoutMs: 30_000,
    retries: 1,
    ...GPT_4O_MINI,
  },
  verify_math: {
    defaultModel: "gpt-4o-mini",
    maxOutputTokens: 50,
    temperature: 0.0,
    requestTimeoutMs: 8_000,
    retries: 1,
    ...GPT_4O_MINI,
  },
};

export function getPurposeConfig(purpose: AiPurpose): PurposeConfig {
  return REGISTRY[purpose];
}

/**
 * Resolve the model id for a purpose, honouring admin overrides
 * (Decision 76) and economy mode (Decision 69).
 */
export function resolveModel(
  purpose: AiPurpose,
  overrides: Record<string, string> | undefined,
  economyMode: boolean,
): { model: string; maxOutputTokens: number; economyApplied: boolean } {
  const cfg = REGISTRY[purpose];
  const overridden = overrides?.[purpose];
  const model = overridden ?? cfg.defaultModel;
  const maxOutputTokens = economyMode
    ? Math.floor(cfg.maxOutputTokens * 0.7)
    : cfg.maxOutputTokens;
  return { model, maxOutputTokens, economyApplied: economyMode };
}

export function estimateCostUsd(
  purpose: AiPurpose,
  inputTokens: number,
  outputTokens: number,
): number {
  const cfg = REGISTRY[purpose];
  return (
    (inputTokens / 1_000_000) * cfg.costPer1MInputUsd +
    (outputTokens / 1_000_000) * cfg.costPer1MOutputUsd
  );
}

export const ALL_PURPOSES: AiPurpose[] = Object.keys(REGISTRY) as AiPurpose[];
