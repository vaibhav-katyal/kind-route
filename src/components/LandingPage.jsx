import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Heart,
  Shirt,
  Utensils,
} from "lucide-react";
import Brand from "./Brand";

const possibilities = [
  {
    name: "A fresh meal",
    category: "Food",
    icon: Utensils,
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
    destination: "A warmer evening.",
  },
  {
    name: "A warm jacket",
    category: "Clothing",
    icon: Shirt,
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=85",
    destination: "Someone’s winter essential.",
  },
  {
    name: "A loved book",
    category: "Books",
    icon: BookOpen,
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=85",
    destination: "A new world to discover.",
  },
];

export default function LandingPage({ onEnter }) {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const page = useRef(null);
  const item = possibilities[active];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    page.current
      ?.querySelectorAll(".reveal-on-scroll")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page" ref={page}>
      <header className="landing-header">
        <a href="#" aria-label="KindRoute home">
          <Brand />
        </a>
        <nav className="landing-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#the-good-circle">The good circle</a>
        </nav>
        <button className="landing-login" onClick={() => onEnter()}>
          Go to dashboard <ArrowUpRight size={17} />
        </button>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">
              <span /> A LITTLE EXTRA. A LOT OF GOOD.
            </p>
            <h1>
              Good things
              <br />
              deserve <span className="serif-italic">another</span>
              <br />
              <span className="beginning-word">
                beginning.
                <svg
                  viewBox="0 0 470 22"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M4 15 Q180 -3 462 9 M45 21 Q260 8 420 14" />
                </svg>
              </span>
            </h1>
            <p className="landing-intro">
              Your extras. Someone’s essentials.
              <br />
              Let’s help them find each other.
            </p>
            <div className="landing-hero-actions">
              <button
                className="landing-primary"
                onClick={() => onEnter("donor", true)}
              >
                I have something to give <ArrowUpRight size={20} />
              </button>
              <button
                className="landing-secondary"
                onClick={() => onEnter("ngo", true)}
              >
                I’m with an NGO <ArrowRight size={18} />
              </button>
            </div>
            <div className="landing-small-note">
              <Heart size={15} /> A meal. A jacket. A book. A fresh start.
            </div>
          </div>

          <div
            className="donation-collage"
            aria-label="Interactive donation story"
          >
            <div className="collage-grid" />
            <div className="collage-orbit" />
            <svg
              className="collage-route"
              viewBox="0 0 600 600"
              fill="none"
              aria-hidden="true"
            >
              <path d="M75 410 C-25 255 178 68 385 110 C560 145 615 350 478 488 C405 565 263 531 259 425" />
              <circle r="6" fill="#2d5e44">
                <animateMotion
                  dur="12s"
                  repeatCount="indefinite"
                  path="M75 410 C-25 255 178 68 385 110 C560 145 615 350 478 488 C405 565 263 531 259 425"
                />
              </circle>
            </svg>
            <span className="collage-caption">
              a small act, a beautiful ripple
            </span>
            <div className="donation-photo" key={item.category}>
              <div className="photo-tape" />
              <img src={item.image} alt={item.name} />
              <div className="photo-bottom">
                <span>{item.name}</span>
                <Heart size={19} />
              </div>
            </div>
            <div className="good-stamp">
              <span>PASS IT ON</span>
              <Heart size={30} strokeWidth={1.4} />
              <span>WITH LOVE</span>
            </div>
            <div className="donation-receipt">
              <span className="receipt-icon">
                <Check size={18} />
              </span>
              <div>
                <strong>A new beginning, found.</strong>
                <span>{item.destination}</span>
              </div>
              <span className="receipt-spark">✳</span>
            </div>
            <div
              className="category-picker"
              role="group"
              aria-label="Explore donation categories"
            >
              {possibilities.map((option, index) => (
                <button
                  key={option.category}
                  className={active === index ? "is-active" : ""}
                  onClick={() => setActive(index)}
                  aria-pressed={active === index}
                >
                  <option.icon size={16} />
                  {option.category}
                </button>
              ))}
            </div>
          </div>
          <a href="#how-it-works" className="landing-scroll">
            <span>GOOD STARTS HERE</span>
            <ArrowDown size={16} />
          </a>
        </section>

        <div
          className="giving-ribbon"
          aria-label="Food, clothing, books, essentials and everything useful"
        >
          <div>
            {[0, 1, 2, 3].map((repeat) => (
              <span
                className="ribbon-group"
                key={repeat}
                aria-hidden={repeat > 0}
              >
                A little less waste <span>✳</span> A little more possibility{" "}
                <span>✳</span> A whole lot of kindness <span>✳</span>
              </span>
            ))}
          </div>
        </div>

        <section className="journey-section reveal-on-scroll" id="how-it-works">
          <div className="journey-heading">
            <div>
              <p className="landing-eyebrow">
                THE SHORTEST DISTANCE TO A DIFFERENCE
              </p>
              <h2>
                From your hands.
                <br />
                <span className="serif-italic">To the right ones.</span>
              </h2>
            </div>
            <p>
              No big gestures needed.
              <br />
              Just something good to share.
            </p>
          </div>
          <div className="journey-demo">
            <div
              className="journey-tabs"
              role="tablist"
              aria-label="Donation journey"
            >
              {[
                [
                  "01",
                  "You share.",
                  "List what you have. We’ll help it find a purpose.",
                ],
                [
                  "02",
                  "We connect.",
                  "A nearby NGO reserves it for their community.",
                ],
                [
                  "03",
                  "Good arrives.",
                  "Follow the pickup. See your kindness delivered.",
                ],
              ].map(([number, title, description], index) => (
                <button
                  key={number}
                  role="tab"
                  id={`journey-tab-${index}`}
                  aria-controls="journey-preview"
                  aria-selected={step === index}
                  onClick={() => setStep(index)}
                  className={`journey-step ${step === index ? "is-active" : ""}`}
                >
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                  <ArrowUpRight size={21} />
                </button>
              ))}
            </div>
            <div
              className="journey-preview"
              id="journey-preview"
              role="tabpanel"
              aria-labelledby={`journey-tab-${step}`}
            >
              <div className="journey-preview-label">
                <span className="live-dot" /> A LITTLE PREVIEW OF THE GOOD
              </div>
              <div key={step} className="journey-scene">
                <div className="journey-node">
                  <span>
                    <Utensils size={26} />
                  </span>
                  <p>You</p>
                </div>
                <div className={`journey-connection journey-state-${step}`}>
                  <svg viewBox="0 0 220 100" aria-hidden="true">
                    <path d="M5 50 C65 -20 150 120 215 50" />
                  </svg>
                  <span className="traveling-heart">
                    <Heart size={23} fill="currentColor" />
                  </span>
                  <small>
                    {
                      [
                        "Something good to give",
                        "A kind connection",
                        "Kindness, delivered",
                      ][step]
                    }
                  </small>
                </div>
                <div
                  className={`journey-node ${step === 2 ? "node-arrived" : ""}`}
                >
                  <span>
                    {step === 2 ? <Check size={28} /> : <Heart size={26} />}
                  </span>
                  <p>A fresh start</p>
                </div>
              </div>
              <div className="journey-demo-note">
                {
                  [
                    "25 fresh meals · ready for a new home",
                    "Matched with a nearby community kitchen",
                    "+120 kindness points · a little good comes back",
                  ][step]
                }
              </div>
              <span className="preview-caption">
                An illustrative donation journey
              </span>
            </div>
          </div>
        </section>

        <section
          id="the-good-circle"
          className="good-circle-section reveal-on-scroll"
        >
          <div className="circle-photo">
            <img
              src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=85"
              alt="Volunteers sharing boxes of donations with their community"
              loading="lazy"
            />
            <span className="photo-footnote">
              Good people. Good things. A shared purpose.
            </span>
          </div>
          <div className="circle-copy">
            <span className="circle-flower">✳</span>
            <p className="landing-eyebrow">THE GOOD CIRCLE</p>
            <h2>
              A little from you.
              <br />
              <span className="serif-italic">A world to someone.</span>
            </h2>
            <p>
              Share what you can. Find what you need.
              <br />
              There’s a place for everyone in this circle.
            </p>
            <button
              className="landing-primary landing-primary-light"
              onClick={() => onEnter("donor", true)}
            >
              Find your place <ArrowUpRight size={20} />
            </button>
            <div className="circle-signoff">
              <Heart size={17} />
              Kindness comes back around.
            </div>
          </div>
        </section>

        <section className="landing-final reveal-on-scroll">
          <span>LESS WASTE. MORE HEART.</span>
          <h2>
            Let’s put your extra
            <br />
            <span className="serif-italic">to extraordinary use.</span>
          </h2>
          <button
            className="landing-round-cta"
            aria-label="Start giving with KindRoute"
            onClick={() => onEnter("donor", true)}
          >
            <ArrowUpRight size={35} />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <Brand />
        <p>A little kindness goes a long way.</p>
        <span>
          Made for a kinder everyday. <Heart size={13} />
        </span>
        <button onClick={() => onEnter()}>
          Explore the demo <ArrowUpRight size={15} />
        </button>
      </footer>
    </div>
  );
}
