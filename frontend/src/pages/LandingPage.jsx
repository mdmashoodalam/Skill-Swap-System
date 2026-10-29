import { Link } from 'react-router-dom'
import { Users, Zap, Award, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="bg-page space-y-14 md:space-y-20">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-dark via-primary to-[#21877a] text-white px-6 py-16 sm:px-10 md:py-24 shadow-lg">
        <div aria-hidden="true" className="absolute -right-16 -top-24 h-80 w-80 rounded-full border-[40px] border-white/5" />
        <div aria-hidden="true" className="absolute -bottom-36 -left-20 h-80 w-80 rounded-full bg-white/5 blur-2xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 mb-6">
            <Sparkles size={16} aria-hidden="true" /> A community built around sharing
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] mb-6">Share what you know.<br className="hidden sm:block" /> Learn what comes next.</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-9 text-white/85">
            Find people with complementary skills, exchange knowledge, and make progress together.
          </p>
          {!isAuthenticated ? (
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/register" className="btn-primary bg-white text-primary hover:bg-cream-100 px-7 py-3.5 inline-flex items-center gap-2">
                Get Started <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn-secondary bg-white/5 border border-white/30 text-white hover:bg-white/15 px-7 py-3.5">
                Sign In
              </Link>
            </div>
          ) : (
            <Link to="/dashboard" className="btn-primary bg-white text-primary hover:bg-cream-100 px-8 py-4 inline-block">
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>

      <section className="py-2">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-12"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary mb-3">A simple exchange</p><h2 className="text-3xl md:text-4xl font-bold text-primary">How it works</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature
              icon={<Users size={40} />}
              title="Discover Matches"
              desc="Our algorithm finds people with complementary skills based on what you offer and want to learn."
            />
            <Feature
              icon={<Zap size={40} />}
              title="Connect & Chat"
              desc="Reach out to matches, chat in real-time, and plan your learning sessions together."
            />
            <Feature
              icon={<Award size={40} />}
              title="Learn & Review"
              desc="Complete sessions and leave reviews to build trust and grow your reputation."
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white border border-surface-300/80 p-6 sm:p-10 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
            <Stat number="10K+" label="Active Learners" />
            <Stat number="50K+" label="Skills Shared" />
            <Stat number="4.8" label="Avg Rating" />
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">Ready to start learning?</h2>
          <p className="text-grey-400 text-lg mb-8">Join thousands of people already exchanging skills</p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-primary px-7 py-3.5 text-lg inline-flex items-center gap-2">
              Create your account <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

function Feature({ icon, title, desc }) {
  return (
    <div className="card text-center h-full">
      <div className="w-16 h-16 mx-auto mb-5 text-primary bg-cream-100 rounded-2xl flex items-center justify-center">{icon}</div>
      <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
      <p className="text-grey-400">{desc}</p>
    </div>
  )
}

function Stat({ number, label }) {
  return (
    <div className="rounded-2xl bg-cream-50 p-5">
      <p className="text-4xl font-bold text-primary mb-2">{number}</p>
      <p className="text-grey-400 font-medium">{label}</p>
    </div>
  )
}
