#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function nativeSassPackageNames() {
  const platform = {
    win32: "win32",
    darwin: "darwin",
    linux: "linux",
  }[process.platform];
  const arch = {
    x64: "x64",
    arm64: "arm64",
    arm: "arm",
  }[process.arch];

  if (!platform || !arch) return [];

  const names = [`sass-embedded-${platform}-${arch}`];
  if (platform === "linux") names.push(`sass-embedded-linux-musl-${arch}`);
  names.push("sass-embedded-all-unknown");
  return names;
}

function findNativeSass() {
  for (const packageName of nativeSassPackageNames()) {
    try {
      const packageRoot = path.dirname(require.resolve(`${packageName}/package.json`));
      const sassRoot = path.join(packageRoot, "dart-sass");
      const executable = process.platform === "win32"
        ? path.join(sassRoot, "sass.bat")
        : path.join(sassRoot, "sass");
      if (fs.existsSync(executable)) return executable;
    } catch {
      // The package is optional and absent on other platforms.
    }
  }
  return null;
}

function createDartSassShim(nativeSass) {
  const shimRoot = fs.mkdtempSync(path.join(os.tmpdir(), "my-blog-hugo-"));
  const shimPath = path.join(
    shimRoot,
    process.platform === "win32" ? "dart-sass.cmd" : "dart-sass",
  );

  if (process.platform === "win32") {
    fs.writeFileSync(shimPath, `@echo off\r\ncall "${nativeSass}" %*\r\n`);
  } else {
    const escaped = nativeSass.replace(/(["\\$`])/g, "\\$1");
    fs.writeFileSync(shimPath, `#!/bin/sh\nexec "${escaped}" "$@"\n`);
    fs.chmodSync(shimPath, 0o755);
  }

  return shimRoot;
}

const nativeSass = findNativeSass();
const temporaryDirectories = [];
const environment = { ...process.env };

if (nativeSass) {
  const shimRoot = createDartSassShim(nativeSass);
  temporaryDirectories.push(shimRoot);
  const nativeSassRoot = path.dirname(nativeSass);
  const nodeRoot = path.dirname(process.execPath);
  const pathKey = Object.keys(environment).find((key) => key.toLowerCase() === "path") || "PATH";
  environment[pathKey] = [shimRoot, nativeSassRoot, nodeRoot, environment[pathKey]]
    .filter(Boolean)
    .join(path.delimiter);
  if (pathKey !== "PATH") delete environment.PATH;
}

const hugo = process.env.HUGO_BINARY || (process.platform === "win32" ? "hugo.exe" : "hugo");
const result = spawnSync(hugo, process.argv.slice(2), {
  env: environment,
  stdio: "inherit",
});

for (const directory of temporaryDirectories) {
  fs.rmSync(directory, { recursive: true, force: true });
}

if (result.error) {
  console.error(`无法启动 Hugo: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
