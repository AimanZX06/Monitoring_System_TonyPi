// Save this as: frontend/scripts/generate_component_docs.js
// Run: node scripts/generate_component_docs.js

const fs = require('fs');
const path = require('path');

function extractComponents(srcDir = './src/components') {
    const components = [];

    function walkDir(dir) {
        if (!fs.existsSync(dir)) {
            return;
        }

        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                walkDir(filePath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                const content = fs.readFileSync(filePath, 'utf-8');

                // Extract component name
                const componentMatch = content.match(/export\s+(?:default\s+)?(?:const|function)\s+(\w+)/);

                // Extract props interface
                const propsMatch = content.match(/interface\s+(\w+Props)\s*\{([^}]+)\}/);

                // Extract JSX structure
                const jsxMatch = content.match(/return\s*\(([\s\S]*?)\);/);

                // Extract imports
                const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];

                components.push({
                    name: componentMatch ? componentMatch[1] : 'Unknown',
                    file: filePath,
                    props: propsMatch ? propsMatch[2].trim() : 'No props',
                    imports: importMatches.length,
                    hasJSX: !!jsxMatch
                });
            }
        });
    }

    walkDir(srcDir);
    return components;
}

function extractPages(srcDir = './src/pages') {
    const pages = [];

    if (!fs.existsSync(srcDir)) {
        return pages;
    }

    const files = fs.readdirSync(srcDir);

    files.forEach(file => {
        if (file.endsWith('.tsx')) {
            const filePath = path.join(srcDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            pages.push({
                name: file.replace('.tsx', ''),
                file: filePath,
                size: content.length,
                lines: content.split('\n').length
            });
        }
    });

    return pages;
}

function extractDependencies() {
    const packageJsonPath = './package.json';
    if (!fs.existsSync(packageJsonPath)) {
        return {};
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        version: packageJson.version,
        description: packageJson.description
    };
}

// Generate documentation
console.log('='.repeat(80));
console.log('FRONTEND COMPONENT DOCUMENTATION EXTRACTION');
console.log('='.repeat(80));

console.log('\n[1] COMPONENTS');
console.log('-'.repeat(80));
const components = extractComponents();
components.forEach(comp => {
    console.log(`\nComponent: ${comp.name}`);
    console.log(`  File: ${comp.file}`);
    console.log(`  Props: ${comp.props.substring(0, 60)}...`);
    console.log(`  Imports: ${comp.imports}`);
});
console.log(`\nTotal components: ${components.length}`);

console.log('\n[2] PAGES');
console.log('-'.repeat(80));
const pages = extractPages();
pages.forEach(page => {
    console.log(`\nPage: ${page.name}`);
    console.log(`  Size: ${(page.size / 1024).toFixed(2)} KB`);
    console.log(`  Lines: ${page.lines}`);
});
console.log(`\nTotal pages: ${pages.length}`);

console.log('\n[3] DEPENDENCIES');
console.log('-'.repeat(80));
const deps = extractDependencies();
console.log(`\nDependencies: ${Object.keys(deps.dependencies || {}).length}`);
Object.entries(deps.dependencies || {}).slice(0, 10).forEach(([name, version]) => {
    console.log(`  - ${name}: ${version}`);
});

// Export to JSON
const exportData = {
    components,
    pages,
    dependencies: deps,
    generatedAt: new Date().toISOString()
};

fs.writeFileSync('component_documentation.json', JSON.stringify(exportData, null, 2));

console.log('\n✅ Documentation exported to: component_documentation.json');
