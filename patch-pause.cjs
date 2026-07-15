const fs = require('fs');
const file = 'src/components/client/NicheHub.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldState = `  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused]);`;

const newState = `  const isPausedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);`;

content = content.replace(oldState, newState);

content = content.replace(/setIsPaused\(true\)/g, 'isPausedRef.current = true');
content = content.replace(/setIsPaused\(false\)/g, 'isPausedRef.current = false');

// Let's add touch-pan-y to allow vertical scroll if the browser is confused
// Wait, actually adding touch-pan-y restricts panning to Y only! 
// Let's NOT add it, or add `touch-auto`.
// Just remove any touch-pan-* classes if they exist, which I already did.
// But wait, the issue is on iOS Safari sometimes a snap-x container absorbs vertical swipes.
// The fix is often `touch-action: pan-y pan-x;` which is `touch-pan-y touch-pan-x` in tailwind.
// Or just not setting it. I will leave it empty.

fs.writeFileSync(file, content, 'utf8');
