import {
  buildOauthProviderAuthResult,
  emptyPluginConfigSchema,
  type OpenClawPluginApi,
  type ProviderAuthContext,
} from "openclaw/plugin-sdk";
import { loginGeminiCliOAuth } from "./oauth.js";

const PROVIDERS = [
  {
    id: "gemini-pro",
    label: "Gemini Pro (CLI OAuth)",
    defaultModel: "gemini-pro/gemini-3.1-pro-preview",
  },
  {
    id: "gemini-flash",
    label: "Gemini Flash (CLI OAuth)",
    defaultModel: "gemini-flash/gemini-3-flash-preview",
  },
  {
    id: "gemini-lite",
    label: "Gemini Lite (CLI OAuth)",
    defaultModel: "gemini-lite/gemini-2.5-flash-lite",
  },
] as const;

const ENV_VARS = [
  "OPENCLAW_GEMINI_OAUTH_CLIENT_ID",
  "OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET",
  "GEMINI_CLI_OAUTH_CLIENT_ID",
  "GEMINI_CLI_OAUTH_CLIENT_SECRET",
];

const geminiCliPlugin = {
  id: "google-gemini-cli-auth",
  name: "Google Gemini CLI Auth",
  description: "OAuth flow for Gemini CLI (Google Code Assist)",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    for (const provider of PROVIDERS) {
      const { id, label, defaultModel } = provider;
      api.registerProvider({
        id,
        label,
        docsPath: "/providers/models",
        envVars: ENV_VARS,
        auth: [
          {
            id: "oauth",
            label: "Google OAuth",
            hint: "PKCE + localhost callback",
            kind: "oauth",
            run: async (ctx: ProviderAuthContext) => {
              const spin = ctx.prompter.progress("Starting Gemini CLI OAuth…");
              try {
                const result = await loginGeminiCliOAuth({
                  isRemote: ctx.isRemote,
                  openUrl: ctx.openUrl,
                  log: (msg) => ctx.runtime.log(msg),
                  note: ctx.prompter.note,
                  prompt: async (message) => String(await ctx.prompter.text({ message })),
                  progress: spin,
                });

                spin.stop("Gemini CLI OAuth complete");
                return buildOauthProviderAuthResult({
                  providerId: id,
                  defaultModel,
                  access: result.access,
                  refresh: result.refresh,
                  expires: result.expires,
                  email: result.email,
                  credentialExtra: { projectId: result.projectId },
                  notes: ["If requests fail, set GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_PROJECT_ID."],
                });
              } catch (err) {
                spin.stop("Gemini CLI OAuth failed");
                await ctx.prompter.note(
                  "Trouble with OAuth? Ensure your Google account has Gemini CLI access.",
                  "OAuth help",
                );
                throw err;
              }
            },
          },
        ],
      });
    }
  },
};

export default geminiCliPlugin;
