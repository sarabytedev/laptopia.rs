import "@/App.css";

const VIDEO_URL =
  "https://customer-assets.emergentagent.com/job_f3d96d59-e4ea-404b-8c4c-d6fbe13697bb/artifacts/c9kqwhsr_dis_mac_vid.mp4";

function App() {
  return (
    <main className="laptopia-hero" data-testid="laptopia-hero">
      <video
        className="laptopia-hero__video"
        src={VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        data-testid="laptopia-hero-video"
      />
      <div className="laptopia-hero__content">
        <h1 className="laptopia-hero__title" data-testid="laptopia-hero-title">
          Laptopia.rs
        </h1>
        <p
          className="laptopia-hero__subtitle"
          data-testid="laptopia-hero-subtitle"
        >
          Gde tehnologija ponovo oživi. Uskoro.
        </p>
      </div>
    </main>
  );
}

export default App;
