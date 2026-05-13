import { useEffect, useMemo, useRef, useState } from "react";
import "@/App.css";

// Single MP4 H.264 sa svakim frejmom kao keyframe — radi u svim browserima
// (uključujući iOS Safari) i omogućava instant seek za scroll-scrub.
const VIDEO_SRC = "/hero.mp4";

const PHONE_NUMBER_DISPLAY = "060 660 0868";
const PHONE_NUMBER_TEL = "+381606600868";

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

const LAST_STAGE_INDEX = STAGES.length - 1;

function App() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const rafRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Scroll-scrub video + section progress
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

  // Anti-download deterrent (bez uticaja na layout/scroll-scrub):
  // contextmenu i dragstart se hvataju preko addEventListener u runtime-u.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const prevent = (e) => e.preventDefault();
    v.addEventListener("contextmenu", prevent);
    v.addEventListener("dragstart", prevent);
    return () => {
      v.removeEventListener("contextmenu", prevent);
      v.removeEventListener("dragstart", prevent);
    };
  }, []);

  // Active stage index from progress (no overlap)
  const activeIdx = useMemo(() => {
    const i = Math.floor(progress * STAGES.length);
    return Math.min(STAGES.length - 1, Math.max(0, i));
  }, [progress]);

  const stage = STAGES[activeIdx];
  const isLastStage = activeIdx === LAST_STAGE_INDEX;

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
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-2 px-6 sm:gap-4 md:flex-row md:gap-12 md:px-12 lg:gap-16 lg:px-16">
          {/* Video — first in DOM so it appears ABOVE the text on mobile */}
          <div
            className="order-1 flex h-[50vh] w-full flex-none items-center justify-center md:order-2 md:h-auto md:flex-1"
            data-testid="laptopia-hero-video-col"
          >
            <video
              ref={videoRef}
              data-testid="laptopia-hero-video"
              src={VIDEO_SRC}
              muted
              playsInline
              preload="metadata"
              disablePictureInPicture
              className="block aspect-square w-full max-h-[42vh] max-w-[360px] object-contain md:max-h-[70vh] md:max-w-[560px]"
            />
          </div>

          {/* Text */}
          <div
            className="order-2 flex h-[38vh] w-full flex-none items-start justify-center md:order-1 md:h-[70vh] md:flex-1 md:items-center md:justify-start"
            data-testid="laptopia-hero-text-col"
          >
            <div
              key={activeIdx}
              data-testid={`laptopia-stage-${activeIdx + 1}`}
              className="laptopia-stage flex w-full max-w-xl flex-col items-center text-center md:items-start md:text-left"
              style={{ color: "#002f70" }}
            >
              <h1
                data-testid={`laptopia-stage-${activeIdx + 1}-heading`}
                className="laptopia-stage__heading text-2xl leading-[1.1] tracking-tight sm:text-3xl md:text-5xl lg:text-6xl"
                style={{ fontFamily: '"Sanchez", serif' }}
              >
                {stage.heading}
              </h1>
              <p
                data-testid={`laptopia-stage-${activeIdx + 1}-subheading`}
                className="laptopia-stage__sub mt-3 max-w-lg text-sm leading-relaxed opacity-80 sm:text-base md:mt-6 md:text-xl"
                style={{ fontFamily: '"Sanchez", serif' }}
              >
                {stage.subheading}
              </p>

              {/* CTA — vidljiv samo na poslednjem stage-u */}
              {isLastStage && (
                <a
                  href={`tel:${PHONE_NUMBER_TEL}`}
                  data-testid="laptopia-cta-call"
                  aria-label={`Pozovite nas na broj ${PHONE_NUMBER_DISPLAY}`}
                  className="laptopia-cta mt-5 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] sm:text-sm md:mt-6 md:px-5 md:py-2.5"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#002f70",
                    border: "1.5px solid #002f70",
                    fontFamily: '"Sanchez", serif',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Pozovite nas
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          data-testid="laptopia-scroll-hint"
          className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 transition-opacity duration-500 md:bottom-6"
          style={{
            color: "#002f70",
            opacity: scrolled ? 0 : 0.7,
            fontFamily: '"Sanchez", serif',
          }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase sm:text-xs">
            Skrolujte
          </span>
          <span className="relative block h-9 w-[1px] overflow-hidden">
            <span className="laptopia-scroll-line absolute inset-x-0 top-0 block h-full w-full bg-current" />
          </span>
        </div>
      </div>
    </main>
  );
}

export default App;
