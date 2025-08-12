// scripts/diagnostics/print_repo_tree.mjs
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

// ----- CLI flags
const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const [k, v] = process.argv[i].split("=");
  args.set(k.replace(/^--/, ""), v ?? true);
}

const startDir = path.resolve(args.get("root") || ROOT);
const maxDepth = Number(args.get("depth") || 6);
const saveAscii = args.get("save") !== "false";
const saveMermaid = args.get("mermaid") !== "false";
const png = args.get("png") === "true"; // requires mmdc

// default excludes (comma-separated override via --exclude="a,b,c")
const defaultExcludes = [
  "node_modules",
  ".git",
  ".DS_Store",
  ".cache",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".next",
  ".vercel",
  ".idea",
  ".vscode",
  "logs/output",
  "core/voice/output",
  "voice/trained",
  "voice/wav_training/_unsorted",
  ".venv",
  "__pycache__",
];
const extraEx = (args.get("exclude") || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const excludes = new Set([...defaultExcludes, ...extraEx]);

// ----- util
function isExcluded(p) {
  const rel = path.relative(startDir, p);
  if (!rel || rel.startsWith("..")) return false;
  const parts = rel.split(path.sep);
  return parts.some(part => excludes.has(part) || excludes.has(parts.slice(0, parts.indexOf(part) + 1).join("/")));
}

async function listDirSafe(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

// ----- walk
async function walk(dir, depth = 0) {
  if (depth > maxDepth) return [];
  const entries = await listDirSafe(dir);
  const dirs = [];
  const files = [];

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (isExcluded(full)) continue;
    if (e.isDirectory()) {
      dirs.push({ name: e.name, full });
    } else if (e.isFile()) {
      files.push({ name: e.name, full });
    }
  }

  dirs.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  const children = [];
  for (const d of dirs) {
    const kids = await walk(d.full, depth + 1);
    children.push({ type: "dir", name: d.name, full: d.full, children: kids });
  }
  for (const f of files) {
    children.push({ type: "file", name: f.name, full: f.full });
  }
  return children;
}

// ----- render ASCII
function renderAsciiTree(nodes, prefix = "") {
  const lines = [];
  nodes.forEach((node, idx) => {
    const isLast = idx === nodes.length - 1;
    const branch = isLast ? "└── " : "├── ";
    if (node.type === "dir") {
      lines.push(prefix + branch + node.name + "/");
      const nextPrefix = prefix + (isLast ? "    " : "│   ");
      lines.push(...renderAsciiTree(node.children || [], nextPrefix));
    } else {
      lines.push(prefix + branch + node.name);
    }
  });
  return lines;
}

// ----- render Mermaid (mindmap)
function renderMermaidMindmap(nodes, label = path.basename(startDir)) {
  const lines = ["mindmap", `  root((${label}))`];
  function add(nodes, indent = "  ") {
    for (const n of nodes) {
      const tag = n.type === "dir" ? "folder" : "file";
      lines.push(`${indent}${tag}("${n.name}")`);
      if (n.type === "dir" && n.children?.length) {
        lines.push(`${indent}  ${tag}:::container`);
        add(n.children, indent + "    ");
      }
    }
  }
  add(nodes);
  lines.push("classDef container fill:#eef,stroke:#99f,stroke-width:1px;");
  return lines.join("\n");
}

// ----- ensure output dirs
async function ensure(p) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

// ----- main
(async () => {
  console.log(`📁 Scanning: ${startDir}`);
  console.log(`↳ depth=${maxDepth}  excludes=${[...excludes].join(", ") || "(none)"}`);

  const tree = await walk(startDir, 0);
  const ascii = [path.basename(startDir) + "/", ...renderAsciiTree(tree)].join("\n");

  // print to console
  console.log("\n" + ascii);

  const asciiPath = path.join(ROOT, "logs/diagnostics/repo_tree.txt");
  const mermaidPath = path.join(ROOT, "docs/repo_structure.mmd");

  if (saveAscii) {
    await ensure(asciiPath);
    await fs.writeFile(asciiPath, ascii, "utf-8");
    console.log(`\n📝 ASCII tree saved → ${asciiPath}`);
  }

  if (saveMermaid) {
    const mmd = renderMermaidMindmap(tree);
    await ensure(mermaidPath);
    await fs.writeFile(mermaidPath, mmd, "utf-8");
    console.log(`🧭 Mermaid mindmap saved → ${mermaidPath}`);

    if (png) {
      // try to render PNG if mermaid-cli is available
      const { spawn } = await import("node:child_process");
      const pngOut = mermaidPath.replace(/\.mmd$/, ".png");
      await new Promise((resolve) => {
        const proc = spawn("mmdc", ["-i", mermaidPath, "-o", pngOut], { stdio: "inherit" });
        proc.on("close", (code) => {
          if (code === 0) {
            console.log(`🖼️  Mermaid PNG saved → ${pngOut}`);
          } else {
            console.warn("⚠️ mmdc not available or failed; PNG not generated.");
          }
          resolve();
        });
      });
    }
  }
})();