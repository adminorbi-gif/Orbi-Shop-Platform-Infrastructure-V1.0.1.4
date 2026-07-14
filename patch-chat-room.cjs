const fs = require('fs');
const file = 'src/components/chat/ChatRoom.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /messages\.map\(\(msg, idx\) => \{/g;
if (content.match(regex)) {
    content = content.replace(regex, `(searchQuery.trim() ? messages.filter(m => m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase())) : messages).map((msg, idx) => {`);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully replaced messages.map with filtered messages.");
} else {
    console.log("Regex did not match");
}
