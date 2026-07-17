const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npm run build', { cwd: '/Users/Shared/Predator_60/apps/predator-analytics-ui', encoding: 'utf-8', stdio: 'pipe' });
  fs.writeFileSync('/Users/Shared/Predator_60/apps/predator-analytics-ui/build_output.txt', output);
  console.log("Success");
} catch (error) {
  fs.writeFileSync('/Users/Shared/Predator_60/apps/predator-analytics-ui/build_output.txt', error.stdout + '\n' + error.stderr);
  console.log("Failed");
}
