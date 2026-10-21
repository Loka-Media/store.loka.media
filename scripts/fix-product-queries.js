import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('../store-api.loka.media/src/queries/productQueries.js');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '    if (search) {';
const endMarker = '    if (creator) {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const cleanBlock = `    if (search) {
        const searchTerms = search.trim().split(/\\s+/).filter(term => term.length > 0);
        const escapeLike = (str) => str.replace(/[%_\\\\]/g, '\\\\$&');

        if (searchTerms.length === 1) {
            paramCount++;
            whereConditions.push(\`(p.name ILIKE $\${paramCount} OR p.description ILIKE $\${paramCount} OR p.tags::text ILIKE $\${paramCount})\`);
            queryParams.push(\`%\${escapeLike(searchTerms[0])}%\`);
        } else {
            const searchConditions = searchTerms.map(term => {
                paramCount++;
                queryParams.push(\`%\${escapeLike(term)}%\`);
                return \`(p.name ILIKE $\${paramCount} OR p.description ILIKE $\${paramCount} OR p.tags::text ILIKE $\${paramCount})\`;
            });
            whereConditions.push(\`(\${searchConditions.join(' OR ')})\`);
        }
    }

`;
    content = content.substring(0, startIndex) + cleanBlock + content.substring(endIndex);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully replaced search block in productQueries.js');
} else {
    console.error('Markers not found', { startIndex, endIndex });
}
