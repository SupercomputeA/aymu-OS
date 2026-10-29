import { describe, expect, it } from "vitest";
import { useFileStore } from "./fileStore";

describe("useFileStore", () => {
  it("seeds the base file system", () => {
    const { getNodeByPath, getChildren } = useFileStore.getState();
    expect(getNodeByPath("/home")?.type).toBe("folder");
    expect(getChildren("/home").length).toBeGreaterThan(0);
  });

  it("creates a file and reads it back by path", () => {
    const { createFile, getNodeByPath } = useFileStore.getState();
    const created = createFile("/home/Desktop", "ci-test-note.txt", "hello ci");
    expect(created.path).toBe("/home/Desktop/ci-test-note.txt");
    expect(getNodeByPath("/home/Desktop/ci-test-note.txt")?.content).toBe("hello ci");
  });

  it("renames a node and updates its path", () => {
    const { createFile, renameNode, getNodeByPath } = useFileStore.getState();
    const created = createFile("/home/Documents", "rename-me.txt");
    renameNode(created.id, "renamed.txt");
    expect(getNodeByPath("/home/Documents/renamed.txt")).toBeDefined();
    expect(getNodeByPath("/home/Documents/rename-me.txt")).toBeUndefined();
  });

  it("deletes a node", () => {
    const { createFile, deleteNode, getNodeByPath } = useFileStore.getState();
    const created = createFile("/home/Documents", "delete-me.txt");
    deleteNode(created.id);
    expect(getNodeByPath("/home/Documents/delete-me.txt")).toBeUndefined();
  });
});
