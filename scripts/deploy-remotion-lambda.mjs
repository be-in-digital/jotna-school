#!/usr/bin/env node
/**
 * One-command Remotion Lambda deployment for the "Pio au tableau" pipeline.
 *
 *   node scripts/deploy-remotion-lambda.mjs [--region=us-east-1]
 *
 * Does, in order (idempotent — safe to re-run):
 *   1. Checks AWS credentials (default profile or AWS_* env vars).
 *   2. Ensures the `remotion-lambda-role` IAM role exists (trust: lambda)
 *      with the official Remotion role policy (scripts/aws/remotion-role-policy.json).
 *   3. Deploys the Remotion render function (`remotion lambda functions deploy`).
 *   4. Bundles & uploads the composition site (`remotion lambda sites create`).
 *   5. Writes the REMOTION_* env vars to the Convex deployment so
 *      convex/explainRender.ts starts rendering on Lambda automatically.
 *
 * Prerequisite: the AWS user must carry the permissions of
 * scripts/aws/remotion-user-policy.json (attach it in the AWS console:
 * IAM → Users → <user> → Add permissions → Create inline policy → JSON).
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const regionArg = process.argv.find((a) => a.startsWith("--region="));
const REGION =
  regionArg?.split("=")[1] || process.env.REMOTION_AWS_REGION || "us-east-1";
const ROLE_NAME = "remotion-lambda-role";
const SITE_NAME = "pio-explainer";

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", ...opts });

const step = (msg) => console.log(`\n▶ ${msg}`);

// 1. Credentials ------------------------------------------------------------
step("Vérification des credentials AWS…");
let identity;
try {
  identity = JSON.parse(run("aws", ["sts", "get-caller-identity"]));
  console.log(`  OK — ${identity.Arn}`);
} catch {
  console.error(
    "  ✖ Pas de credentials AWS valides (profil default ou variables AWS_*).",
  );
  process.exit(1);
}

// 2. IAM role ---------------------------------------------------------------
step(`Rôle IAM « ${ROLE_NAME} »…`);
try {
  run("aws", ["iam", "get-role", "--role-name", ROLE_NAME], {
    stdio: "pipe",
  });
  console.log("  Existe déjà — inchangé.");
} catch {
  console.log("  Absent → création…");
  const trust = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { Service: "lambda.amazonaws.com" },
        Action: "sts:AssumeRole",
      },
    ],
  });
  try {
    run("aws", [
      "iam",
      "create-role",
      "--role-name",
      ROLE_NAME,
      "--assume-role-policy-document",
      trust,
    ]);
    const rolePolicy = readFileSync(
      join(process.cwd(), "scripts/aws/remotion-role-policy.json"),
      "utf8",
    );
    run("aws", [
      "iam",
      "put-role-policy",
      "--role-name",
      ROLE_NAME,
      "--policy-name",
      "remotion-lambda-policy",
      "--policy-document",
      rolePolicy,
    ]);
    console.log("  Créé avec la policy Remotion officielle.");
  } catch (err) {
    console.error(
      `  ✖ Impossible de créer le rôle (droits IAM manquants ?).\n` +
        `    Attache d'abord scripts/aws/remotion-user-policy.json à l'utilisateur ` +
        `${identity.Arn}\n    (Console AWS → IAM → Users → Add permissions → JSON), puis relance.\n`,
    );
    console.error(String(err.stderr ?? err));
    process.exit(1);
  }
}

// 3. Lambda function ----------------------------------------------------------
step(`Déploiement de la fonction de rendu (région ${REGION})…`);
let functionName;
try {
  const out = run("npx", [
    "remotion",
    "lambda",
    "functions",
    "deploy",
    `--region=${REGION}`,
    "--quiet",
  ]);
  functionName = out.trim().split("\n").pop().trim();
  if (!functionName.startsWith("remotion-render")) {
    throw new Error(`sortie inattendue: ${out}`);
  }
  console.log(`  ${functionName}`);
} catch (err) {
  console.error("  ✖ Échec du déploiement de la fonction :");
  console.error(String(err.stdout ?? "") + String(err.stderr ?? err));
  process.exit(1);
}

// 4. Site bundle --------------------------------------------------------------
step("Bundle et upload de la composition (site S3)…");
let serveUrl;
try {
  const out = run("npx", [
    "remotion",
    "lambda",
    "sites",
    "create",
    "remotion/index.ts",
    `--site-name=${SITE_NAME}`,
    `--region=${REGION}`,
    "--quiet",
  ]);
  serveUrl = (out.match(/https:\/\/\S+/) ?? [out.trim().split("\n").pop()])[0];
  console.log(`  ${serveUrl}`);
} catch (err) {
  console.error("  ✖ Échec de l'upload du site :");
  console.error(String(err.stdout ?? "") + String(err.stderr ?? err));
  process.exit(1);
}

// 5. Convex env ---------------------------------------------------------------
step("Configuration du déploiement Convex…");
const keyId = run("aws", ["configure", "get", "aws_access_key_id"]).trim();
const secret = run("aws", ["configure", "get", "aws_secret_access_key"]).trim();
const convexSet = (k, v) => {
  run("npx", ["convex", "env", "set", k, v]);
  console.log(`  ${k} ✓`);
};
convexSet("REMOTION_AWS_REGION", REGION);
convexSet("REMOTION_LAMBDA_FUNCTION_NAME", functionName);
convexSet("REMOTION_SERVE_URL", serveUrl);
convexSet("REMOTION_AWS_ACCESS_KEY_ID", keyId);
convexSet("REMOTION_AWS_SECRET_ACCESS_KEY", secret);

console.log(`
✅ Remotion Lambda est branché.

Dès qu'un exercice est créé : script → voix de Pio → rendu Lambda → MP4 dans
Convex storage, sans worker local. Test manuel :

  npx convex run explainRender:requestRender '{"explanationId":"<id>"}'

(Pour la prod Convex : relancer ce script avec CONVEX_DEPLOYMENT pointé sur
la prod, ou copier les 5 variables REMOTION_* dans son dashboard.)`);
