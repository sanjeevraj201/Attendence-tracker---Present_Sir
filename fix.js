const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('TabScreenWrapper')) {
        content = content.replace(/import \{ TabScreenWrapper \} from '.*?';\r?\n/g, '');
        content = content.replace(/<TabScreenWrapper name=\"[^\"]+\">\r?\n?/g, '');
        content = content.replace(/<\/TabScreenWrapper>\r?\n?/g, '');
        fs.writeFileSync(fullPath, content);
        console.log('Fixed ' + fullPath);
      }
    }
  }
}

processDir('app');
