import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function getFiles(dir, ext) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                results = results.concat(getFiles(full, ext));
            }
        } else if (full.endsWith(ext)) {
            results.push(full);
        }
    }
    return results;
}

const apiFiles = getFiles('../store-api.loka.media/src', '.js');
console.log(`Checking ${apiFiles.length} JavaScript files in store-api.loka.media/src...`);
let apiErrors = 0;
for (const file of apiFiles) {
    try {
        execSync(`node --check "${file}"`, { stdio: 'pipe' });
    } catch (e) {
        console.error(`Syntax error in: ${file}`);
        apiErrors++;
    }
}
console.log(`store-api.loka.media syntax check complete. Errors: ${apiErrors}`);

// Check Loka.next directory if it exists
const lokaNextDir = path.resolve('../Loka.next');
if (fs.existsSync(lokaNextDir)) {
    console.log(`Found ${lokaNextDir}`);
    const lokaNextPkg = JSON.parse(fs.readFileSync(path.join(lokaNextDir, 'package.json'), 'utf8'));
    console.log('Loka.next scripts:', lokaNextPkg.scripts);
} else {
    console.log('Loka.next directory not found at ../Loka.next');
}
