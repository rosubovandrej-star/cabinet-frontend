const fs = require('fs');
const file = 'src/components/ui/hover-border-gradient.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard export function with React.memo wrapper
content = content.replace(
  'export function HoverBorderGradient({',
  'export const HoverBorderGradient = React.memo(function HoverBorderGradient({'
);

// Add closing parenthesis to the end of the file
const lines = content.split('\n');
if (lines[lines.length - 1] === '') {
  lines.pop();
}

if (lines[lines.length - 1] === '}') {
  lines[lines.length - 1] = '});';
}

fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
console.log('patched');
