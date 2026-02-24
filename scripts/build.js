#!/usr/bin/env node

/**
 * Build script for Zenith VSCode Extension
 * Supports dual publishing to VSCode Marketplace and Open VSX
 * 
 * Usage:
 *   node scripts/build.js marketplace  - Build for VSCode Marketplace (ZenithBuild)
 *   node scripts/build.js openvsx      - Build for Open VSX (zenithbuild)
 *   node scripts/build.js all          - Build both
 *   node scripts/build.js              - Defaults to marketplace
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TARGETS = {
    marketplace: {
        publisher: 'ZenithBuild',
        outputSuffix: 'vscode-marketplace'
    },
    openvsx: {
        publisher: 'zenithbuild',
        outputSuffix: 'openvsx'
    }
};

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const rootDir = path.join(__dirname, '..');
const EXTENSION_ID = 'zenith-language';
const REQUIRED_PACKAGING_DEPS = ['vscode-languageclient'];

function readPackageJsonRaw() {
    return fs.readFileSync(packageJsonPath, 'utf8');
}

function isDependencyInstalled(depName) {
    return fs.existsSync(path.join(rootDir, 'node_modules', depName, 'package.json'));
}

function ensurePackagingDependencies() {
    const missing = REQUIRED_PACKAGING_DEPS.filter((dep) => !isDependencyInstalled(dep));
    if (missing.length === 0) {
        return;
    }

    console.log(`📥 Installing missing packaging dependencies: ${missing.join(', ')}`);
    execSync('bun install', {
        cwd: rootDir,
        stdio: 'inherit'
    });
}

function build(target) {
    const config = TARGETS[target];
    if (!config) {
        console.error(`Unknown target: ${target}`);
        console.error('Valid targets: marketplace, openvsx, all');
        process.exit(1);
    }

    console.log(`\n🔧 Building for ${target}`);
    console.log(`   Publisher: ${config.publisher}\n`);

    // Read package.json
    const originalPackageJsonRaw = readPackageJsonRaw();
    const packageJson = JSON.parse(originalPackageJsonRaw);
    const originalName = packageJson.name;

    // Output filename
    const outputName = `${EXTENSION_ID}-${config.outputSuffix}.vsix`;
    const outputPath = path.join(rootDir, outputName);

    // Update publisher
    packageJson.publisher = config.publisher;
    packageJson.name = EXTENSION_ID;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');

    try {
        // Run vsce package
        console.log('📦 Packaging extension...\n');
        ensurePackagingDependencies();
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        execSync(`npx vsce package --out "${outputName}"`, {
            cwd: rootDir,
            stdio: 'inherit'
        });

        if (!fs.existsSync(outputPath)) {
            throw new Error(`Expected build artifact was not created: ${outputName}`);
        }

        console.log(`\n✅ Built: ${outputName}`);
        console.log(`   Publisher: ${config.publisher}`);
        console.log(`   Version: ${packageJson.version}`);
        console.log(`   Extension ID: ${EXTENSION_ID}`);
        console.log(`   Original package name: ${originalName}`);

        if (target === 'marketplace') {
            console.log('\n📤 To publish to VSCode Marketplace:');
            console.log(`   npx vsce publish --packagePath "${outputName}"`);
        } else {
            console.log('\n📤 To publish to Open VSX:');
            console.log(`   npx ovsx publish ${outputName} -p <TOKEN>`);
        }

        return outputName;

    } finally {
        // Restore package.json exactly as it was before this build
        fs.writeFileSync(packageJsonPath, originalPackageJsonRaw);
    }
}

function buildAll() {
    console.log('🚀 Building for all targets...\n');
    const outputs = [];

    for (const target of Object.keys(TARGETS)) {
        outputs.push(build(target));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📦 All builds complete!\n');
    console.log('Generated files:');
    outputs.forEach(output => console.log(`   • ${output}`));
    console.log('');
}

// Get target from command line
const target = process.argv[2] || 'marketplace';

if (target === 'all') {
    buildAll();
} else {
    build(target);
}
