const fs = require('fs');
// Very naive inspection, just check if we can read some strings from it.
const data = fs.readFileSync('/Users/dima1203/Desktop/model/deep_space_skybox.glb');
console.log('Size:', data.length);
// Search for "mesh" or nodes to see what's inside
const str = data.toString('utf8');
const match = str.match(/"nodes":\[(.*?)\]/);
const matchMeshes = str.match(/"meshes":\[(.*?)\]/);
if (match) console.log('Nodes:', match[1].substring(0, 200));
if (matchMeshes) console.log('Meshes:', matchMeshes[1].substring(0, 200));
