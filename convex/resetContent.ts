import { mutation } from "./_generated/server";

/**
 * One-shot cleanup used during development to wipe all pedagogical content
 * (PDFs, topics, exercises, attempts, progress, reports, earned badges)
 * while keeping user accounts, subjects and badge definitions intact.
 *
 * Run via:  pnpx convex run resetContent:wipeAll
 *
 * WARNING: irreversible. Do not expose from the UI.
 */
export const wipeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const deletedCounts: Record<string, number> = {};

    const wipe = async (table: "pdfUploads" | "exercises" | "topics" | "attempts" | "studentTopicProgress" | "topicReports" | "earnedBadges") => {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
      deletedCounts[table] = rows.length;
    };

    // Delete leaf tables first, then their parents.
    await wipe("attempts");
    await wipe("studentTopicProgress");
    await wipe("topicReports");
    await wipe("earnedBadges");
    await wipe("exercises");
    await wipe("pdfUploads");
    await wipe("topics");

    return deletedCounts;
  },
});
