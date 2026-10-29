import { describe, expect, it } from "vitest";
import { generateSeedFiles } from "./seedFileSystem";
import type { FileSystemNode } from "@/types/os";

const baseFolders: FileSystemNode[] = [
  { id: "documents", name: "Documents", type: "folder", path: "/home/Documents", parentId: "home", createdAt: new Date(0), modifiedAt: new Date(0) },
  { id: "pictures", name: "Pictures", type: "folder", path: "/home/Pictures", parentId: "home", createdAt: new Date(0), modifiedAt: new Date(0) },
  { id: "music", name: "Music", type: "folder", path: "/home/Music", parentId: "home", createdAt: new Date(0), modifiedAt: new Date(0) },
];

describe("generateSeedFiles", () => {
  it("generates one node per manifest entry", () => {
    expect(generateSeedFiles(baseFolders)).toHaveLength(4); // 1 markdown + 1 image + 2 songs
  });

  it("assigns stable ids grouped by category", () => {
    const ids = generateSeedFiles(baseFolders).map((n) => n.id).sort();
    expect(ids).toEqual(["seed-img-1", "seed-md-1", "seed-music-1", "seed-music-2"]);
  });

  it("resolves parentId from existing folders", () => {
    const nodes = generateSeedFiles(baseFolders);
    expect(nodes.find((n) => n.id === "seed-md-1")?.parentId).toBe("documents");
    expect(nodes.find((n) => n.id === "seed-img-1")?.parentId).toBe("pictures");
    expect(nodes.find((n) => n.id === "seed-music-1")?.parentId).toBe("music");
  });

  it("rewrites src/static paths to public /static paths", () => {
    const nodes = generateSeedFiles(baseFolders);
    expect(nodes.find((n) => n.id === "seed-md-1")?.content).toBe(
      "/static/md/understanding-the-stock-market.md",
    );
  });
});
