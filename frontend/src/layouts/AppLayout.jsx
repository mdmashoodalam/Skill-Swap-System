import Navbar from '../components/Navbar'
import { Code2, Mail, Phone } from 'lucide-react'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-page">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-primary focus:shadow-lg">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-15rem)]">
        {children}
      </main>
      <footer className="bg-gradient-to-br from-primary-dark to-primary text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-lg font-bold">S</div>
            <div>
              <p className="text-lg font-semibold">Md Mashood Alam</p>
              <p className="text-sm text-white/75">Java Full Stack Developer · Spring Boot &amp; React</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <a className="min-h-11 inline-flex items-center gap-2 text-white/90 hover:text-white" href="mailto:mashoodalam05@gmail.com"><Mail size={16} aria-hidden="true" /> mashoodalam05@gmail.com</a>
            <a className="min-h-11 inline-flex items-center gap-2 text-white/90 hover:text-white" href="tel:+919572879110"><Phone size={16} aria-hidden="true" /> +91 95728 79110</a>
            <span className="min-h-11 inline-flex items-center gap-2 text-white/90"><Code2 size={16} aria-hidden="true" /> mdmashoodalam</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

