const fs = require('fs');
const path = 'OpportunitiesPage.jsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
// Find the first occurrence of "export default OpportunitiesPage;"
const endLineIndex = lines.findIndex(line => line.trim() === 'export default OpportunitiesPage;');
if (endLineIndex !== -1) {
    // Keep everything up to and including that line
    const newContent = lines.slice(0, endLineIndex + 1).join('\n');
    fs.writeFileSync(path, newContent);
    console.log('Fixed OpportunitiesPage.jsx');
} else {
    console.log('Could not find export default');
}
