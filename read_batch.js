const fs = require('fs');
const path = require('path');

const start = parseInt(process.argv[2]);
const count = parseInt(process.argv[3]);
const rootDir = 'C:\\Users\\rishi\\Downloads\\irms-ai-incident-risk-management-system';

try {
    const fileList = fs.readFileSync('files.txt', 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const batch = fileList.slice(start, start + count);
    const result = [];

    for (const filePath of batch) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
            result.push({ path: relativePath, content: content });
        } catch (err) {
            console.error(`Error reading ${filePath}: ${err.message}`);
        }
    }

    console.log(JSON.stringify(result));
} catch (err) {
    console.error(err);
}
