const fs = require('fs');

const transcriptPath = `C:/Users/Sanju/.gemini/antigravity/brain/8a298efd-8093-4561-8f9b-e5897feb0299/.system_generated/logs/transcript.jsonl`;
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let allText = '';
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.content) {
      if (obj.content.includes('Uth Aur Ja (Pre-Class Reminder)')) {
        allText += obj.content + '\n';
      } else if (obj.content.includes('4. Low Attendance Alert (Danger Zone)')) {
        allText += obj.content + '\n';
      }
    }
  } catch(e) {}
}

const categories = {
  PRE_CLASS: [],
  IN_CLASS: [],
  ANTI_SKIP: [],
  LOW_ATTENDANCE: [],
  POST_CLASS: []
};

let currentCat = null;

const linesText = allText.split('\n');
for (let l of linesText) {
  l = l.trim();
  if (!l) continue;
  
  if (l.includes('1. Uth Aur Ja')) currentCat = 'PRE_CLASS';
  else if (l.includes('2. Mark Attendance Now')) currentCat = 'IN_CLASS';
  else if (l.includes('3. Don\'t Skip')) currentCat = 'ANTI_SKIP';
  else if (l.includes('4. Low Attendance Alert')) currentCat = 'LOW_ATTENDANCE';
  else if (l.includes('5. Post-Class Reflection')) currentCat = 'POST_CLASS';
  else if (
    currentCat && 
    !l.startsWith('Timing:') && 
    !l.startsWith('<USER_REQUEST>') && 
    !l.startsWith('</USER_REQUEST>') && 
    !l.startsWith('The output was truncated') &&
    !l.startsWith('Task:') &&
    !l.startsWith('Requirements:') &&
    !l.startsWith('Read and parse') &&
    !l.startsWith('Convert these categories') &&
    !l.startsWith('Build a testing form') &&
    !l.startsWith('Write clean, scalable code') &&
    !l.startsWith('Ensure the random selection') &&
    !l.startsWith('Here are the categorized') &&
    !l.startsWith('We are building a push')
  ) {
    if (l.length > 5) {
      categories[currentCat].push(l);
    }
  }
}

const tsContent = `export const NotificationCategories = {
  PRE_CLASS: 'Uth Aur Ja (Pre-Class Reminder)',
  IN_CLASS: 'Mark Attendance Now (In-Class Action)',
  ANTI_SKIP: "Don't Skip / Anti-Skip (Motivation & Warnings)",
  LOW_ATTENDANCE: 'Low Attendance Alert (Danger Zone)',
  POST_CLASS: 'Post-Class Reflection'
} as const;

export type NotificationCategory = typeof NotificationCategories[keyof typeof NotificationCategories];

export const NotificationPhrases: Record<NotificationCategory, string[]> = {
  [NotificationCategories.PRE_CLASS]: ${JSON.stringify(categories.PRE_CLASS, null, 2)},
  [NotificationCategories.IN_CLASS]: ${JSON.stringify(categories.IN_CLASS, null, 2)},
  [NotificationCategories.ANTI_SKIP]: ${JSON.stringify(categories.ANTI_SKIP, null, 2)},
  [NotificationCategories.LOW_ATTENDANCE]: ${JSON.stringify(categories.LOW_ATTENDANCE, null, 2)},
  [NotificationCategories.POST_CLASS]: ${JSON.stringify(categories.POST_CLASS, null, 2)}
};
`;

fs.writeFileSync('D:/Project/3.0/present-sir/src/data/notificationPhrases.ts', tsContent);
console.log('Successfully wrote notification phrases!');
