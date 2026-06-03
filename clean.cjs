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
  
  content = content.replace(/\s*if \(token\) headers\['Authorization'\] = `Bearer \$\{token\}`;/g, '');
  content = content.replace(/,\s*credentials: 'include'/g, '');
  content = content.replace(/credentials: 'include',\s*/g, '');
  content = content.replace(/,\s*headers/g, '');
  content = content.replace(/headers,\s*/g, '');
  content = content.replace(/\s*headers\s*/g, ''); 
  
  fs.writeFileSync(file, content);
});
console.log('Done');
