const fs = require('fs');
const path = require('path');

const DEFAULT_SOURCE_ROOT = path.resolve(__dirname, '../.RESAUSE/akashi-list-gh-pages');
const DEFAULT_OUTPUT_FILE = path.resolve(__dirname, '../initial_equip_ships.json');

function decodeHtml(text) {
    return String(text || '')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function normalizeText(text) {
    return decodeHtml(text)
        .replace(/[\u200b-\u200d\ufeff]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseInitialEquipShipsFromHtml(content) {
    const sectionMatch = /<th class=title>本装備の初期装備艦<\/th><\/tr>\s*<tr><td>([\s\S]*?)<\/td>/i.exec(content);
    if (!sectionMatch) return [];

    const sectionHtml = sectionMatch[1];
    const ships = [];
    const anchorRegex = /<a\b[\s\S]*?<\/a>/gi;
    let anchorMatch;

    while ((anchorMatch = anchorRegex.exec(sectionHtml)) !== null) {
        const anchorHtml = anchorMatch[0];
        const shipMatch = /<span>([\s\S]*?)\(Lv\s*(\d+)\)<\/span>/i.exec(anchorHtml);
        if (!shipMatch) continue;

        const name = normalizeText(shipMatch[1]);
        const level = parseInt(shipMatch[2], 10);

        if (!name || Number.isNaN(level)) continue;
        ships.push({ name, level });
    }

    return ships;
}

function resolveDetailDir(inputPath) {
    if (!inputPath) return path.join(DEFAULT_SOURCE_ROOT, 'detail');
    const absolutePath = path.resolve(inputPath);
    if (path.basename(absolutePath).toLowerCase() === 'detail') return absolutePath;
    return path.join(absolutePath, 'detail');
}

// Positional args (order-independent): [sourceDir] [outputFile] [--min-count <n>]
const args = process.argv.slice(2);
let sourceArg, outputArg, minCount = 100;
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--min-count') {
        minCount = parseInt(args[i + 1], 10);
        i++;
    } else if (!sourceArg) {
        sourceArg = args[i];
    } else if (!outputArg) {
        outputArg = args[i];
    }
}
if (Number.isNaN(minCount) || minCount < 0) minCount = 100;

const akashiDetailDir = resolveDetailDir(sourceArg);
const outputFile = outputArg ? path.resolve(outputArg) : DEFAULT_OUTPUT_FILE;

console.log(`Reading files from: ${akashiDetailDir}`);

if (!fs.existsSync(akashiDetailDir)) {
    console.error(`Directory not found: ${akashiDetailDir}`);
    process.exit(1);
}

const files = fs.readdirSync(akashiDetailDir).filter(file => /^w\d+\.html$/i.test(file));
console.log(`Found ${files.length} equipment files.`);

const result = {};

files.forEach(file => {
    try {
        const equipIdMatch = file.match(/^w(\d+)\.html$/i);
        if (!equipIdMatch) return;

        const equipId = parseInt(equipIdMatch[1], 10);
        const content = fs.readFileSync(path.join(akashiDetailDir, file), 'utf-8');
        const ships = parseInitialEquipShipsFromHtml(content);

        if (ships.length > 0) {
            result[equipId] = ships;
        }
    } catch (err) {
        console.error(`Error processing file ${file}:`, err);
    }
});

const equipCount = Object.keys(result).length;
console.log(`Extracted info for ${equipCount} equipment IDs.`);

if (equipCount < minCount) {
    console.error(`ERROR: extracted ${equipCount} equipment IDs, below the minimum of ${minCount}.`);
    console.error('Aborting without writing the output file, to avoid publishing empty/broken data.');
    console.error('The upstream Akashi HTML structure may have changed; check the parsing logic.');
    process.exit(1);
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Data saved to ${outputFile}`);
