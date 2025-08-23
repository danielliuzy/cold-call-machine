/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_vapiWebhook from "../actions/vapiWebhook.js";
import type * as mutations_businesses from "../mutations/businesses.js";
import type * as mutations_calls from "../mutations/calls.js";
import type * as mutations_leads from "../mutations/leads.js";
import type * as mutations_workflows from "../mutations/workflows.js";
import type * as queries_businesses from "../queries/businesses.js";
import type * as queries_calls from "../queries/calls.js";
import type * as queries_leads from "../queries/leads.js";
import type * as queries_settings from "../queries/settings.js";
import type * as tasks from "../tasks.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/vapiWebhook": typeof actions_vapiWebhook;
  "mutations/businesses": typeof mutations_businesses;
  "mutations/calls": typeof mutations_calls;
  "mutations/leads": typeof mutations_leads;
  "mutations/workflows": typeof mutations_workflows;
  "queries/businesses": typeof queries_businesses;
  "queries/calls": typeof queries_calls;
  "queries/leads": typeof queries_leads;
  "queries/settings": typeof queries_settings;
  tasks: typeof tasks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
