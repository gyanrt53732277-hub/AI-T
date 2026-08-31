import Navbar from '../components/shared/Navbar'
import './About.css'

export default function About() {
  return (
    <div className="about">
      <Navbar />
      <div className="container about__content">
        <span className="section-label">Build with Gemma 4 Hackathon 2026</span>
        <h1 className="about__title">About TransCreate</h1>

        <section className="about-section">
          <h2>The Problem</h2>
          <p>
            Indie filmmakers, web series creators, and short-film directors spend years producing their work —
            then face a wall when trying to distribute it globally. Professional dubbing and cultural adaptation
            cost between <strong>$5,000–$15,000 per episode</strong>. Without it, their work remains invisible
            outside their home country.
          </p>
          <p>
            Standard translation tools like Google Translate produce word-for-word outputs that destroy the
            humor, emotional resonance, and cultural subtext of a script. A Hindi joke doesn't land when
            rendered literally in American English. A Mexican idiom means nothing when translated into German
            by a machine that doesn't understand cultural context.
          </p>
        </section>

        <div className="divider" />

        <section className="about-section">
          <h2>The Solution: Transcreation</h2>
          <p>
            Transcreation is a professional technique used by global advertising agencies and film studios —
            but historically reserved for those who can afford large localization teams. TransCreate brings
            this capability to individual creators using AI.
          </p>
          <p>
            Instead of translating words, TransCreate translates <em>intent</em>. Gemma 4 analyzes the
            emotional tone, cultural references, and comedic structure of each script line, then produces an
            adaptation that feels native to the target culture — as if it were written there from the start.
          </p>
        </section>

        <div className="divider" />

        <section className="about-section">
          <h2>Technical Architecture</h2>
          <div className="about-arch">
            <div className="arch-block">
              <span className="arch-block__label">01 — Input</span>
              <p>User uploads an <code>.srt</code>, <code>.vtt</code>, or <code>.txt</code> script file.
              The parser extracts each line with its timestamp and index.</p>
            </div>
            <div className="arch-block">
              <span className="arch-block__label">02 — Google DeepMind Gemma 4</span>
              <p>The script context is sent to <code>gemma-4-27b-it</code> via the Google AI Studio API, utilizing native Function Calling for structured adaptations.</p>
            </div>
            <div className="arch-block">
              <span className="arch-block__label">03 — Function Calling</span>
              <p>Gemma 4 triggers <code>flag_cultural_risk</code>, <code>extract_glossary_term</code>, and <code>generate_dubbing_cue</code> based on the script's cultural gaps.</p>
            </div>
            <div className="arch-block">
              <span className="arch-block__label">04 — Structured Output & TTS</span>
              <p>Each line returns formatted JSON with the adapted text, which can be immediately played back using browser-native Text-To-Speech.</p>
            </div>
            <div className="arch-block">
              <span className="arch-block__label">05 — Export</span>
              <p>The completed transcreation is exported as a properly formatted <code>.srt</code> subtitle file, ready for video editors or voice acting sessions.</p>
            </div>
          </div>
        </section>

        <div className="divider" />

        <section className="about-section">
          <h2>Technologies Used</h2>
          <div className="about-tech-grid">
            {[
              ['Google DeepMind Gemma 4', 'Core AI model (gemma-4-27b-it) for transcreation and function calling'],
              ['Google AI Studio API', 'Direct endpoint access with native JSON schema and Tool calling'],
              ['Web Speech API', 'Browser-native TTS for voice actor pronunciation preview'],
              ['React 18 + TypeScript', 'Type-safe, component-based frontend'],
              ['Vite 5', 'Fast development and production build toolchain'],
            ].map(([tech, desc]) => (
              <div className="about-tech-row" key={tech}>
                <code className="about-tech-row__name">{tech}</code>
                <span className="about-tech-row__desc">{desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
