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
      let modified = false;
      
      const regex = /<(Check|Chevron|MapPin|User|Calendar|CalendarDays|Wifi|LogOut|Settings|Bell|Camera|Plus|Clock|Trash2|Coffee|ArrowRight)\b([^>]*?)className="mr-([0-9.]+)"([^>]*?)\/?>/g;
      
      content = content.replace(regex, (match, iconName, before, margin, after) => {
        modified = true;
        let px = 0;
        if (margin === '1') px = 4;
        else if (margin === '1.5') px = 6;
        else if (margin === '2') px = 8;
        else if (margin === '3') px = 12;
        else if (margin === '4') px = 16;
        
        return '<' + iconName + before + 'style={{ marginRight: ' + px + ' }}' + after + ' />';
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed ' + fullPath);
      }
    }
  }
}

processDir('app');
processDir('src');
