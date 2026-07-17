const fs = require('fs');
const data = fs.readFileSync('public/models/deep_space_skybox_new.glb');
console.log('File size:', data.length);
