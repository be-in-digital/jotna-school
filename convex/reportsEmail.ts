"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";
import { generateReportEmailHtml } from "../lib/email-template";

// ---------------------------------------------------------------------------
// Internal Action — Send email via Resend (Node.js runtime)
// ---------------------------------------------------------------------------

export const sendEmail = internalAction({
  args: { reportId: v.id("topicReports") },
  handler: async (ctx, args) => {
    // Fetch the report
    const report = await ctx.runQuery(internal.reports.internalGetById, {
      id: args.reportId,
    });
    if (!report) {
      throw new Error("Rapport introuvable");
    }

    // Fetch the student profile
    const student = await ctx.runQuery(internal.reports.getStudentProfile, {
      id: report.studentId,
    });
    if (!student) {
      throw new Error("Profil étudiant introuvable");
    }

    // Fetch all guardians for the student
    const guardians = await ctx.runQuery(internal.reports.getGuardians, {
      studentId: report.studentId,
    });

    if (guardians.length === 0) {
      // No guardians to email — mark report without sending
      await ctx.runMutation(internal.reports.markEmailSent, {
        reportId: args.reportId,
      });
      return;
    }

    const reportDate = new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = generateReportEmailHtml({
      studentName: student.name,
      topicName: report.topicName,
      subjectName: report.subjectName,
      score: report.score,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      frequentMistakes: report.frequentMistakes,
      date: reportDate,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send to each guardian
    for (const guardian of guardians) {
      if (!guardian.email) continue;

      await resend.emails.send({
        from: "Jotna School <noreply@jotnaschool.app>",
        to: guardian.email,
        subject: `[Jotna School] Rapport - ${student.name} a terminé ${report.topicName}`,
        html,
      });
    }

    // Mark the email as sent
    await ctx.runMutation(internal.reports.markEmailSent, {
      reportId: args.reportId,
    });
  },
});
