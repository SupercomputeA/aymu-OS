import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn (className merge)", () => {
  it("concatenates simple class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, 0, "", "b")).toBe("a b");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-2 p-4")).toBe("p-4");
    expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
  });
});
