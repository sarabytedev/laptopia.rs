import { useEffect, useRef, useState } from "react";
import "@/App.css";

const VIDEO_URL =
  "https://customer-assets.emergentagent.com/job_laptopia-hero/artifacts/emv0f1wo_dis_mac_vid1080.mp4";

const STAGES = [
  {
    heading: "Vaš uređaj na vrhuncu snage",
    subheading:
      "Specijalizovani servis za laptop računare i kompleksnu elektroniku",
  },
  {
    heading: "Preciznost pre svega",
    subheading: "Rešavamo kvarove tamo gde drugi odustaju",
  },
  {
    heading: "Servis bez nagađanja",
    subheading:
      "Jasna dijagnoza, transparentni troškovi i minimalno vreme zastoja",
  },
  {
    heading: "Laptopia.rs",
    subheading: "Standard za IT podršku. Uskoro",
  },
];

function App() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(0);
  const [progress, setProgress] = useState(0); // 0..1 over the whole section
  const [scrolled, setScrolled] = useState(false);

  // Smooth scroll-scrub video + section progress
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    let duration = 0;
    const onMeta = () => {
      duration = video.duration || 0;
    };
    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    const update = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolledPx = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolledPx / total : 0;
      setProgress(p);
      setScrolled(scrolledPx > 8);
      if (duration > 0) {
        try {
          video.currentTime = Math.min(duration - 0.05, p * duration);
        } catch (e) {
          /* ignore */
        }
      }
      rafRef.current = 0;
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      video.removeEventListener("loadedmetadata", onMeta);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Map global progress to per-stage opacity with crossfade
  const stageOpacity = (i) => {
    const segments = STAGES.length;
    const start = i / segments;
    const end = (i + 1) / segments;
    const fade = 0.5 / segments; // crossfade window

    if (progress < start - fade) return 0;
    if (progress > end + fade) return 0;

    // Fade in
    if (progress < start) {
      return i === 0 ? 1 : (progress - (start - fade)) / fade;
    }
    // Fade out
    if (progress > end) {
      return i === segments - 1 ? 1 : 1 - (progress - end) / fade;
    }
    return 1;
  };

  return (
    <main
      ref={sectionRef}
      data-testid="laptopia-hero"
      className="relative w-full bg-white"
      style={{ height: "400vh", fontFamily: '"Sanchez", serif' }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        data-testid="laptopia-hero-sticky"
      >
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col-reverse items-center justify-center gap-8 px-6 md:flex-row md:gap-12 md:px-12 lg:gap-16 lg:px-16">
          {/* Left: Text stages */}
          <div
            className="relative flex w-full flex-1 items-center justify-start md:h-[70vh]"
            data-testid="laptopia-hero-text-col"
          >
            <div className="relative w-full max-w-xl">
              {STAGES.map((s, i) => (
                <div
                  key={i}
                  data-testid={`laptopia-stage-${i + 1}`}
                  className="absolute inset-0 flex flex-col justify-center transition-opacity duration-300 ease-out will-change-[opacity,transform]"
                  style={{
                    opacity: stageOpacity(i),
                    transform: `translateY(${(1 - stageOpacity(i)) * 12}px)`,
                    color: "#002f70",
                  }}
                >
                  <h1
                    data-testid={`laptopia-stage-${i + 1}-heading`}
                    className="text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
                    style={{ fontFamily: '"Sanchez", serif' }}
                  >
                    {s.heading}
                  </h1>
                  <p
                    data-testid={`laptopia-stage-${i + 1}-subheading`}
                    className="mt-4 max-w-lg text-base leading-relaxed opacity-80 sm:text-lg md:mt-6 md:text-xl"
                    style={{ fontFamily: '"Sanchez", serif' }}
                  >
                    {s.subheading}
                  </p>
                </div>
              ))}
              {/* Spacer to give the absolutely positioned stages a measured height */}
              <div
                aria-hidden
                className="invisible"
                style={{ fontFamily: '"Sanchez", serif' }}
              >
                <h1 className="text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                  {STAGES.reduce(
                    (acc, s) => (s.heading.length > acc.length ? s.heading : acc),
                    "",
                  )}
                </h1>
                <p className="mt-4 max-w-lg text-base leading-relaxed sm:text-lg md:mt-6 md:text-xl">
                  {STAGES.reduce(
                    (acc, s) =>
                      s.subheading.length > acc.length ? s.subheading : acc,
                    "",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Video */}
          <div
            className="flex w-full flex-1 items-center justify-center"
            data-testid="laptopia-hero-video-col"
          >
            <video
              ref={videoRef}
              data-testid="laptopia-hero-video"
              src={VIDEO_URL}
              muted
              playsInline
              preload="auto"
              poster=""
              className="block h-auto w-full max-h-[70vh] max-w-[560px] object-contain"
            />
          </div>
        </div>

        {/* Scroll hint */}
        <div
          data-testid="laptopia-scroll-hint"
          className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 transition-opacity duration-500"
          style={{
            color: "#002f70",
            opacity: scrolled ? 0 : 0.7,
            fontFamily: '"Sanchez", serif',
          }}
        >
          <span className="text-xs tracking-[0.3em] uppercase">Skrolujte</span>
          <span className="relative block h-9 w-[1px] overflow-hidden">
            <span className="laptopia-scroll-line absolute inset-x-0 top-0 block h-full w-full bg-current" />
          </span>
        </div>
      </div>
    </main>
  );
}

export default App;
