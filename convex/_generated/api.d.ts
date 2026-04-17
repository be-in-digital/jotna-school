/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attempts from "../attempts.js";
import type * as auth from "../auth.js";
import type * as badges from "../badges.js";
import type * as exercises from "../exercises.js";
import type * as http from "../http.js";
import type * as pdfUploads from "../pdfUploads.js";
import type * as profiles from "../profiles.js";
import type * as progress from "../progress.js";
import type * as reports from "../reports.js";
import type * as reportsEmail from "../reportsEmail.js";
import type * as students from "../students.js";
import type * as subjects from "../subjects.js";
import type * as topics from "../topics.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attempts: typeof attempts;
  auth: typeof auth;
  badges: typeof badges;
  exercises: typeof exercises;
  http: typeof http;
  pdfUploads: typeof pdfUploads;
  profiles: typeof profiles;
  progress: typeof progress;
  reports: typeof reports;
  reportsEmail: typeof reportsEmail;
  students: typeof students;
  subjects: typeof subjects;
  topics: typeof topics;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
