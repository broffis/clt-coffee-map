import { beforeEach, describe, expect, it, vi } from "vitest";
import { runOwnerBootstrapCommand } from "../scripts/bootstrap-owner";

const mocks = vi.hoisted(() => ({
  clientOptions: vi.fn(),
  connect: vi.fn(),
  close: vi.fn(),
  bootstrap: vi.fn(),
  question: vi.fn(),
  closePrompt: vi.fn(),
  stdin: { isTTY: true },
  stdout: { isTTY: true },
}));

vi.mock("node:process", () => ({
  stdin: mocks.stdin,
  stdout: mocks.stdout,
}));
vi.mock("node:readline/promises", () => ({
  createInterface: () => ({
    question: mocks.question,
    close: mocks.closePrompt,
  }),
}));
vi.mock("mongodb", () => ({
  MongoClient: class {
    constructor(_uri: string, options: unknown) {
      mocks.clientOptions(options);
    }

    connect = mocks.connect;
    close = mocks.close;
  },
}));
vi.mock("../src/authorization/owner-bootstrap.ts", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../src/authorization/owner-bootstrap.ts")
  >()),
  bootstrapInitialOwner: mocks.bootstrap,
}));

const env = {
  BOOTSTRAP_MONGODB_URI: "mongodb://localhost:27017",
  BOOTSTRAP_MONGODB_DB_NAME: "bootstrap_test",
  BOOTSTRAP_CLERK_USER_ID: "user_owner",
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.stdin.isTTY = true;
  mocks.stdout.isTTY = true;
  mocks.connect.mockResolvedValue(undefined);
  mocks.close.mockResolvedValue(undefined);
  mocks.bootstrap.mockResolvedValue(undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

describe("local owner bootstrap command", () => {
  it("only preflights unless apply is explicitly requested", async () => {
    await runOwnerBootstrapCommand([], env);

    expect(mocks.clientOptions).toHaveBeenCalledWith(
      expect.objectContaining({ socketTimeoutMS: expect.any(Number) }),
    );
    expect(mocks.clientOptions.mock.calls[0]?.[0]).not.toHaveProperty(
      "timeoutMS",
    );
    expect(mocks.bootstrap).toHaveBeenCalledWith(
      expect.anything(),
      {
        uri: env.BOOTSTRAP_MONGODB_URI,
        databaseName: env.BOOTSTRAP_MONGODB_DB_NAME,
        userId: env.BOOTSTRAP_CLERK_USER_ID,
      },
      { apply: false },
    );
    expect(mocks.question).not.toHaveBeenCalled();
    expect(mocks.close).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      "Preflight passed. No records written or permissions granted.",
    );
  });

  it("requires the exact target ID before applying", async () => {
    mocks.question.mockResolvedValueOnce(env.BOOTSTRAP_CLERK_USER_ID);
    await runOwnerBootstrapCommand(["--apply"], env);

    expect(mocks.bootstrap).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { apply: true },
    );
    expect(mocks.closePrompt).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      "Initial owner and audit entry committed. Remove the temporary database user and bootstrap file.",
    );
  });

  it("does not connect or write when the confirmation differs", async () => {
    mocks.question.mockResolvedValueOnce("user_someoneelse");

    await expect(runOwnerBootstrapCommand(["--apply"], env)).rejects.toThrow(
      "Confirmation did not match. Nothing was written.",
    );
    expect(mocks.bootstrap).not.toHaveBeenCalled();
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.closePrompt).toHaveBeenCalled();
  });

  it("rejects noninteractive grants", async () => {
    mocks.stdin.isTTY = false;

    await expect(runOwnerBootstrapCommand(["--apply"], env)).rejects.toThrow(
      "Applying bootstrap requires an interactive terminal.",
    );
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.bootstrap).not.toHaveBeenCalled();
  });

  it("rejects unknown arguments before connecting", async () => {
    await expect(runOwnerBootstrapCommand(["--force"], env)).rejects.toThrow(
      "Usage: pnpm admin:bootstrap-owner [--apply]",
    );
    expect(mocks.connect).not.toHaveBeenCalled();
  });

  it("closes the client and never reports success after failure", async () => {
    mocks.bootstrap.mockRejectedValueOnce(new Error("storage failure"));

    await expect(runOwnerBootstrapCommand([], env)).rejects.toThrow();
    expect(mocks.close).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
});
