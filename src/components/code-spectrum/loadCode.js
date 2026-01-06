export async function loadCode(file) {
    try {
        // In Next.js with App Router, we can use dynamic imports or just static imports if we know them.
        // Since we're in a client component flow often, let's use a mapping for simplicity and to avoid dynamic path issues.

        const dataMap = {
            "kotlin.json": () => import("@/data/kotlin.json"),
            "c.json": () => import("@/data/c.json"),
            "flutter.json": () => import("@/data/flutter.json"),
            "cs.json": () => import("@/data/cs.json"),
            "cshift.json": () => import("@/data/cshift.json"),
            "rust.json": () => import("@/data/rust.json"),
            "go.json": () => import("@/data/go.json"),
        };

        if (dataMap[file]) {
            const loadedModule = await dataMap[file]();
            return loadedModule.default;
        }
        throw new Error(`File ${file} not found in spectrum mapping`);
    } catch (error) {
        console.error(`Error loading code for ${file}:`, error);
        return { title: "Error", subtitle: "Failed to load", code: "// Error loading " + file };
    }
}
