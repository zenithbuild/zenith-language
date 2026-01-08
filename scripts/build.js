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
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const originalPublisher = packageJson.publisher;
    const version = packageJson.version;
    const name = packageJson.name;

    // Output filename
    const outputName = `${name}-${config.outputSuffix}.vsix`;
    const defaultOutput = `${name}-${version}.vsix`;

    // Update publisher
    packageJson.publisher = config.publisher;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');

    try {
        // Run vsce package
        console.log('📦 Packaging extension...\n');
        execSync('vsce package', {
            cwd: rootDir,
            stdio: 'inherit'
        });

        // Rename to target-specific name
        const defaultPath = path.join(rootDir, defaultOutput);
        const outputPath = path.join(rootDir, outputName);

        if (fs.existsSync(defaultPath)) {
            // Remove existing output if present
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            fs.renameSync(defaultPath, outputPath);
        }

        console.log(`\n✅ Built: ${outputName}`);
        console.log(`   Publisher: ${config.publisher}`);
        console.log(`   Version: ${version}`);

        if (target === 'marketplace') {
            console.log('\n📤 To publish to VSCode Marketplace:');
            console.log('   vsce publish');
        } else {
            console.log('\n📤 To publish to Open VSX:');
            console.log(`   npx ovsx publish ${outputName} -p <TOKEN>`);
        }

        return outputName;

    } finally {
        // Restore original publisher
        packageJson.publisher = originalPublisher;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');
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
