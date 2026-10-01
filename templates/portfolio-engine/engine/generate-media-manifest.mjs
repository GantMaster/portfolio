import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { manifestFile, mediaRoots } from "./media.config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supportedExtensions = new Set([
    ".mp4", ".webm", ".mov", ".m4v",
    ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif",
]);

async function collectFiles(relativeDirectory) {
    let entries;
    try {
        entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }

    const nested = await Promise.all(entries.map(async entry => {
        const relativePath = path.posix.join(relativeDirectory, entry.name);
        if (entry.isDirectory()) return collectFiles(relativePath);
        if (!entry.isFile() || !supportedExtensions.has(path.extname(entry.name).toLowerCase())) return [];
        return [relativePath];
    }));
    return nested.flat();
}

const media = [];
for (const rootConfig of mediaRoots) {
    for (const src of await collectFiles(rootConfig.directory)) {
        media.push({
            id: src.replace(/[^a-zA-Z0-9_-]/g, "-"),
            src,
            type: rootConfig.type,
            suggestedCategory: rootConfig.suggestedCategory,
        });
    }
}

media.sort((a, b) => a.src.localeCompare(b.src, "en", { numeric: true, sensitivity: "base" }));
await writeFile(path.join(root, manifestFile), `${JSON.stringify(media, null, 2)}\n`, "utf8");
console.log(`Indexed ${media.length} media files into ${manifestFile}.`);
