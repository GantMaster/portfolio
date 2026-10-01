import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoots = [
    { directory: "assets/videos", type: "video" },
];
const supportedExtensions = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv", ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const excludedFiles = new Set(["checker.png", "favicon.ico"]);

async function collectFiles(relativeDirectory) {
    const absoluteDirectory = path.join(root, relativeDirectory);
    let entries;
    try {
        entries = await readdir(absoluteDirectory, { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }

    const nested = await Promise.all(entries.map(async entry => {
        const relativePath = path.posix.join(relativeDirectory, entry.name);
        if (entry.isDirectory()) return collectFiles(relativePath);
        if (!entry.isFile() || excludedFiles.has(entry.name.toLowerCase())) return [];
        if (!supportedExtensions.has(path.extname(entry.name).toLowerCase())) return [];
        return [relativePath];
    }));
    return nested.flat();
}

const media = [];
for (const { directory, type } of mediaRoots) {
    const files = await collectFiles(directory);
    for (const src of files) {
        media.push({
            src,
            type,
            suggestedTab: src.includes("/modeling/") ? "modeling" : "motion",
        });
    }
}

media.sort((a, b) => a.src.localeCompare(b.src, "en", { numeric: true, sensitivity: "base" }));
await writeFile(path.join(root, "assets-manifest.json"), `${JSON.stringify(media, null, 2)}\n`, "utf8");
console.log(`Indexed ${media.length} portfolio media files.`);
