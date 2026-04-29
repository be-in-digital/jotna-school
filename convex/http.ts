import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/link-response",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");

    if (!token || (action !== "accept" && action !== "reject")) {
      return new Response(htmlPage("Lien invalide", "Ce lien est invalide ou mal forme."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const result: { error: string } | { success: boolean; action: string } =
      await ctx.runMutation(internal.linkRequests.resolveByToken, {
        token,
        action,
      });

    if ("error" in result) {
      return new Response(htmlPage("Erreur", result.error), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const title = action === "accept" ? "Liaison acceptee !" : "Demande refusee";
    const message =
      action === "accept"
        ? "Ton parent peut maintenant suivre ta progression sur Jotna School. Tu peux fermer cette page."
        : "La demande a ete refusee. Le parent ne sera pas lie a ton compte. Tu peux fermer cette page.";

    return new Response(htmlPage(title, message), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }),
});

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — Jotna School</title>
<style>
  body{margin:0;font-family:Arial,sans-serif;background:#f3f4f6;display:flex;justify-content:center;align-items:center;min-height:100vh}
  .card{background:#fff;border-radius:12px;padding:40px;max-width:440px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  h1{color:#0d9488;font-size:24px;margin:0 0 12px}
  p{color:#374151;font-size:16px;line-height:1.5;margin:0}
</style>
</head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body>
</html>`;
}

export default http;
