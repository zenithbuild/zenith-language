#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const sample = process.env.ZENITH_NVIM_SAMPLE;
const serverCmd = process.env.ZENITH_LANGUAGE_SERVER_CMD || "zenith-language-server";
const serverArgs = (process.env.ZENITH_LANGUAGE_SERVER_ARGS || "")
  .split(/\s+/)
  .filter(Boolean);

if (!sample) {
  console.error("Set ZENITH_NVIM_SAMPLE to a real .zen file before running this smoke.");
  process.exit(2);
}

const neovim = spawnSync("nvim", ["--version"], { encoding: "utf8" });
if (neovim.status !== 0) {
  console.log("SKIP: nvim not installed");
  process.exit(0);
}

const version = /^NVIM v(\d+)\.(\d+)\.(\d+)/.exec(neovim.stdout);
if (!version || (Number(version[1]) === 0 && Number(version[2]) < 10)) {
  console.log("SKIP: nvim >= 0.10 required");
  process.exit(0);
}

const workdir = await mkdtemp(join(tmpdir(), "zenith-real-nvim-"));
const resultPath = join(workdir, "result.json");
const luaPath = join(workdir, "smoke.lua");

await writeFile(luaPath, smokeLua(), "utf8");

try {
  const run = await runNeovim(luaPath, {
    ZENITH_LANGUAGE_ROOT: packageRoot,
    ZENITH_LANGUAGE_SERVER_CMD: serverCmd,
    ZENITH_LANGUAGE_SERVER_ARGS: serverArgs.join("\n"),
    ZENITH_NVIM_SAMPLE: resolve(sample),
    ZENITH_NVIM_RESULT: resultPath
  });
  const result = JSON.parse(await readFile(resultPath, "utf8"));
  if (run.code !== 0 || !result.ok) {
    console.error(JSON.stringify(result, null, 2));
    console.error(run.stderr);
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
} finally {
  await rm(workdir, { recursive: true, force: true });
}

function runNeovim(luaPath, env) {
  return new Promise((resolve, reject) => {
    const child = spawn("nvim", ["--headless", "-u", "NONE", "-n", "-S", luaPath], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Timed out waiting for Neovim smoke\n${stderr}`));
    }, 20000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function smokeLua() {
  return String.raw`
local result_path = assert(os.getenv("ZENITH_NVIM_RESULT"))
local package_root = assert(os.getenv("ZENITH_LANGUAGE_ROOT"))
local sample = assert(os.getenv("ZENITH_NVIM_SAMPLE"))
local server_cmd = assert(os.getenv("ZENITH_LANGUAGE_SERVER_CMD"))
local server_args = os.getenv("ZENITH_LANGUAGE_SERVER_ARGS") or ""

local function write(payload)
  vim.fn.writefile({ vim.json.encode(payload) }, result_path)
end

local function fail(message, extra)
  extra = extra or {}
  extra.ok = false
  extra.message = message
  write(extra)
  vim.cmd("cquit")
end

vim.opt.runtimepath:prepend(package_root)
vim.cmd("runtime plugin/zenith.lua")
vim.cmd("filetype on")
vim.cmd("syntax enable")

vim.cmd("edit " .. vim.fn.fnameescape(sample))
local bufnr = vim.api.nvim_get_current_buf()
if vim.bo[bufnr].filetype ~= "zenith" then
  fail("Expected filetype=zenith", { filetype = vim.bo[bufnr].filetype })
end

local function syntax_at(line, col)
  return vim.fn.synIDattr(vim.fn.synID(line, col, 1), "name")
end

local syntax = {
  first = syntax_at(1, 2),
  later = syntax_at(math.min(vim.api.nvim_buf_line_count(bufnr), 20), 1)
}
if syntax.first == "" and syntax.later == "" then
  fail("Expected Zenith syntax highlighting groups", { filetype = vim.bo[bufnr].filetype, syntax = syntax })
end

local cmd = { server_cmd }
for arg in string.gmatch(server_args, "[^\n]+") do
  table.insert(cmd, arg)
end
local config = {
  name = "zenith-language-server-installed-smoke",
  cmd = cmd,
  root_dir = vim.fs.root(0, { "zenith.config.js", "zenith.config.ts", "package.json", ".git" }) or vim.fn.getcwd(),
  filetypes = { "zenith" }
}
local client_id = vim.lsp.start(config)
if client_id == nil then
  fail("vim.lsp.start returned nil")
end

if not vim.wait(10000, function()
  return #vim.lsp.get_clients({ bufnr = bufnr, name = config.name }) > 0
end, 50) then
  fail("Zenith language server did not attach", { filetype = vim.bo[bufnr].filetype })
end
local attached_clients = #vim.lsp.get_clients({ bufnr = bufnr, name = config.name })

local uri = vim.uri_from_bufnr(bufnr)
local valid_lines = {
  '<script setup="ts">',
  'const count = signal(0);',
  '</script>',
  '<button on:click={increment}>{count}</button>',
}
vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, {
  unpack(valid_lines),
})
if not vim.wait(10000, function()
  return #vim.diagnostic.get(bufnr) == 0
end, 50) then
  fail("Expected valid edit to have no diagnostics before hover/completion")
end
uri = vim.uri_from_bufnr(bufnr)
local hover = vim.lsp.buf_request_sync(bufnr, "textDocument/hover", {
  textDocument = { uri = uri },
  position = { line = 1, character = 15 }
}, 3000)
local completion = vim.lsp.buf_request_sync(bufnr, "textDocument/completion", {
  textDocument = { uri = uri },
  position = { line = 3, character = 12 }
}, 3000)
local completion_ok = completion ~= nil
local hover_ok = hover ~= nil

vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, {
  '<button onclick={save}>Save</button>',
})
if not vim.wait(10000, function()
  return #vim.diagnostic.get(bufnr) > 0
end, 50) then
  fail("Expected diagnostics after invalid edit", { clients = #vim.lsp.get_clients({ bufnr = bufnr, name = config.name }) })
end
local diagnostic = vim.diagnostic.get(bufnr)[1]

vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, {
  unpack(valid_lines),
})
if not vim.wait(10000, function()
  return #vim.diagnostic.get(bufnr) == 0
end, 50) then
  fail("Expected diagnostics to clear after valid reload")
end
if #vim.lsp.get_clients({ bufnr = bufnr, name = config.name }) == 0 then
  fail("Expected Zenith language server to remain attached after valid restore")
end

write({
  ok = true,
  filetype = vim.bo[bufnr].filetype,
  attachedClients = attached_clients,
  activeClients = #vim.lsp.get_clients({ name = config.name }),
  bufferClients = #vim.lsp.get_clients({ bufnr = bufnr, name = config.name }),
  diagnostic = {
    code = tostring(diagnostic.code),
    source = diagnostic.source,
    message = diagnostic.message,
    lnum = diagnostic.lnum,
    col = diagnostic.col
  },
  completionRequestReturned = completion_ok,
  hoverRequestReturned = hover_ok,
  syntax = syntax
})
vim.cmd("qa!")
`;
}
