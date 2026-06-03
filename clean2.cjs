const fs = require('fs');
const files = [
  'src/pages/Network.tsx',
  'src/pages/Settings.tsx',
  'src/pages/NewUser.tsx',
  'src/pages/NewEquipment.tsx',
  'src/pages/Users.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove token and headers setup
  content = content.replace(/\s*const token = localStorage\.getItem\('token'\);\s*const headers: Record<string, string> = \{\};\s*if \(token\) headers\['Authorization'\] = `Bearer \$\{token\}`;/gs, '');
  content = content.replace(/\s*const token = localStorage\.getItem\('token'\);\s*const headers = \{ 'Authorization': `Bearer \$\{token\}` \};/gs, '');
  content = content.replace(/\s*const token = localStorage\.getItem\('token'\);/gs, '');
  
  // Remove headers from fetch options
  content = content.replace(/,\s*headers/g, '');
  content = content.replace(/headers,\s*/g, '');
  content = content.replace(/headers: \{ 'Authorization': `Bearer \$\{token\}` \},?/g, '');
  content = content.replace(/headers: \{.*?Authorization.*?\},?/gs, '');
  
  // Remove credentials: 'include' as it is now handled globally
  content = content.replace(/,\s*credentials: 'include'/g, '');
  content = content.replace(/credentials: 'include',\s*/g, '');
  
  // Remove empty options object
  content = content.replace(/,\s*\{\s*\}/g, '');
  
  fs.writeFileSync(file, content);
});
console.log('Done');
