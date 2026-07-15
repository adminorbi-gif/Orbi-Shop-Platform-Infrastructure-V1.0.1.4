const fs = require('fs');
const file = 'src/pages/ClientApp/index.tsx';
let content = fs.readFileSync(file, 'utf8');

const importStatement = `import * as LucideIcons from 'lucide-react';
import { LayoutGrid, X } from 'lucide-react';`;
content = content.replace('import { motion, AnimatePresence } from "motion/react";', 'import { motion, AnimatePresence } from "motion/react";\n' + importStatement);

fs.writeFileSync(file, content, 'utf8');
