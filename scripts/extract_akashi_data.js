const fs = require('fs');
const path = require('path');

// The path where akashi-list data is located relative to this script
// Script is in d:\VibeCoding\poi-plugin-equips-farm\scripts\
// Data is in d:\VibeCoding\poi-plugin-equips-farm\.RESAUSE\akashi-list-gh-pages\detail\
const AKASHI_DETAIL_DIR = path.resolve(__dirname, '../.RESAUSE/akashi-list-gh-pages/detail');
const OUTPUT_FILE = path.resolve(__dirname, '../initial_equip_ships.json');

console.log(`Reading files from: ${AKASHI_DETAIL_DIR}`);

if (!fs.existsSync(AKASHI_DETAIL_DIR)) {
    console.error(`Directory not found: ${AKASHI_DETAIL_DIR}`);
    process.exit(1);
}

const files = fs.readdirSync(AKASHI_DETAIL_DIR).filter(f => /^w\d+\.html$/.test(f));
console.log(`Found ${files.length} equipment files.`);

const result = {};

files.forEach(file => {
    try {
        const equipIdMatch = file.match(/^w(\d+)\.html$/);
        if (!equipIdMatch) return;
        
        const equipId = parseInt(equipIdMatch[1], 10);
        const content = fs.readFileSync(path.join(AKASHI_DETAIL_DIR, file), 'utf-8');

        // Regex to find the table row containing "本装備の初期装備艦" and capture the content in the next row's cell
        // The structure is roughly: <th class=title>本装備の初期装備艦</th></tr><tr><td>...content...</td>
        // content contains <a>...<span>Name(LvX)</span></a>
        
        // We look for the header, then the following tr/td
        const tableHeaderRegex = /<th class=title>本装備の初期装備艦<\/th><\/tr>\s*<tr><td>(.*?)<\/td>/s;
        const match = tableHeaderRegex.exec(content);
        
        if (match) {
            const shipHtmlContent = match[1];
            
            // Now extract ships: <span>Name(LvX)</span>
            // Sometimes it might be inside <a> tags, but we just care about the span content
            // The regex needs to handle potential whitespace
            const shipRegex = /<span>(.*?)\(Lv(\d+)\)<\/span>/g;
            let shipMatch;
            const ships = [];
            
            while ((shipMatch = shipRegex.exec(shipHtmlContent)) !== null) {
                ships.push({
                    name: shipMatch[1].trim(), // Ship Name
                    level: parseInt(shipMatch[2], 10) // Level
                });
            }
            
            if (ships.length > 0) {
                result[equipId] = ships;
            }
        }
    } catch (err) {
        console.error(`Error processing file ${file}:`, err);
    }
});

console.log(`Extracted info for ${Object.keys(result).length} equipment IDs.`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Data saved to ${OUTPUT_FILE}`);
