import { describe, expect, it, vi } from "vitest";

vi.mock("openclaw/plugin-sdk", () => ({
  buildOauthProviderAuthResult: vi.fn(),
  emptyPluginConfigSchema: () => ({}),
}));

vi.mock("./oauth.js", () => ({
  loginGeminiCliOAuth: vi.fn(),
}));

describe("geminiCliPlugin.register", () => {
  it("registers exactly three providers", async () => {
    const { default: plugin } = await import("./index.js");
    const registerProvider = vi.fn();
    plugin.register({ registerProvider } as any);

    expect(registerProvider).toHaveBeenCalledTimes(3);
  });

  it("registers gemini-pro, gemini-flash, and gemini-lite", async () => {
    const { default: plugin } = await import("./index.js");
    const registerProvider = vi.fn();
    plugin.register({ registerProvider } as any);

    const ids = registerProvider.mock.calls.map((call) => call[0].id);
    expect(ids).toContain("gemini-pro");
    expect(ids).toContain("gemini-flash");
    expect(ids).toContain("gemini-lite");
  });

  it("sets correct default models", async () => {
    const { buildOauthProviderAuthResult } = await import("openclaw/plugin-sdk");
    const mockBuild = vi.mocked(buildOauthProviderAuthResult);
    const { loginGeminiCliOAuth } = await import("./oauth.js");
    vi.mocked(loginGeminiCliOAuth).mockResolvedValue({
      access: "tok", refresh: "ref", expires: 0, projectId: "proj",
    });

    const { default: plugin } = await import("./index.js");
    const registerProvider = vi.fn();
    plugin.register({ registerProvider } as any);

    // Invoke the auth run() for each provider to trigger buildOauthProviderAuthResult
    const fakeCtx = {
      isRemote: false,
      openUrl: vi.fn(),
      runtime: { log: vi.fn() },
      prompter: {
        progress: () => ({ stop: vi.fn(), update: vi.fn() }),
        note: vi.fn(),
        text: vi.fn().mockResolvedValue(""),
      },
    } as any;

    for (const [call] of registerProvider.mock.calls) {
      await call.auth[0].run(fakeCtx);
    }

    const defaultModels = mockBuild.mock.calls.map((c) => c[0].defaultModel);
    expect(defaultModels).toContain("gemini-pro/gemini-3.1-pro-preview");
    expect(defaultModels).toContain("gemini-flash/gemini-3-flash-preview");
    expect(defaultModels).toContain("gemini-lite/gemini-2.5-flash-lite");
  });
});
