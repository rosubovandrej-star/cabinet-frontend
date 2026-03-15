const fs = require('fs');
const file = 'src/components/ui/hover-border-gradient.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace standard export function with React.memo wrapper
content = content.replace(
  'export function HoverBorderGradient({',
  'export const HoverBorderGradient = React.memo(function HoverBorderGradient({'
);

// Add closing parenthesis to the end of the file
if (content.endsWith('}\n')) {
  content = content.substring(0, content.length - 2) + '});\n';
} else {
  content += '\n});\n';
}

fs.writeFileSync(file, content, 'utf8');
console.log('patched');
