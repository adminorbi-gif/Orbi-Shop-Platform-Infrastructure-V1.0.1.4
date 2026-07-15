const fs = require('fs');
const file = 'src/components/client/NicheHub.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the placeholder onClick in the modal with proper SPA navigation
const targetOnClick = `                                     onClick={(e) => {
                                        e.preventDefault();
                                        onSelectNiche(niche.name);
                                        // Optional: trigger category select if we had that method, 
                                        // but for now since onSelectNiche is standard, it will switch the niche. 
                                        setShowAllCategories(false);
                                     }}`;

const replacementOnClick = `                                     onClick={(e) => {
                                        e.preventDefault();
                                        const href = e.currentTarget.getAttribute('href');
                                        if (href) {
                                           window.history.pushState({}, "", href);
                                           window.dispatchEvent(new Event("popstate"));
                                        }
                                        setShowAllCategories(false);
                                     }}`;

content = content.replace(targetOnClick, replacementOnClick);

fs.writeFileSync(file, content, 'utf8');
