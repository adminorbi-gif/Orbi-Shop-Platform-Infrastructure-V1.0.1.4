const fs = require('fs');
const file = 'src/components/client/NicheHub.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true, loop: true }, [AutoScroll({ playOnInit: true, speed: 0.5, stopOnInteraction: false, stopOnMouseEnter: true })]);",
  "const [emblaRef, emblaApi] = useEmblaCarousel({ dragFree: true, loop: true }, [AutoScroll({ playOnInit: true, speed: 1, stopOnInteraction: false, stopOnMouseEnter: true })]);"
);

// We need to move the plugins array to a memo or something? No, Embla React hook says `useEmblaCarousel(options, plugins)`.
// Actually, `useEmblaCarousel` handles plugin array updates, but it's best if we don't recreate it.

fs.writeFileSync(file, content, 'utf8');
