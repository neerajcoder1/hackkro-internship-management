import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowRight,
  ClipboardList,
  BarChart3,
  Users,
  ShieldCheck,
} from 'lucide-react';
import heroIllustration from '../assets/hackkro-login-illustration.jpg';
import PortalSelection from '../components/PortalSelection.jsx';

export default function HomePage() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="w-full bg-white flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 mb-6">
              <span>Internship Management Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Build Skills. Complete Milestones.{' '}
              <span className="text-blue-600">Grow Your Career.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg mt-5 leading-relaxed max-w-xl">
              One workspace to manage internship assignments, submit your work, track performance and receive meaningful feedback.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/intern"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <span>Go to Intern Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Admin Console</span>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer w-full sm:w-auto group"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <span>Sign In</span>
                  </Link>

                  <a
                    href="#portals"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-600 hover:text-blue-600 font-semibold text-sm transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <span>Choose Portal &darr;</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Attached HackKro Illustration */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <div className="w-full max-w-xl lg:max-w-2xl bg-white rounded-2xl p-2 sm:p-4 flex items-center justify-center">
              <img
                src={heroIllustration}
                alt="HackKro Internship Management System - A Smarter Way to Manage Internships"
                className="w-full h-auto max-h-[360px] sm:max-h-[460px] lg:max-h-[520px] object-contain transition-all"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* PORTAL SELECTION SECTION */}
      <div id="portals" className="border-t border-slate-100 bg-slate-50/50">
        <PortalSelection />
      </div>

      {/* THREE CORE FEATURE CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Task & Project Management */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-start space-x-4 hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Task & Project Management
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get assigned daily and weekly tasks with clear deadlines.
              </p>
            </div>
          </div>

          {/* Card 2: Progress & Points Tracking */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-start space-x-4 hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Progress & Points Tracking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track your submissions, earn points and monitor your performance.
              </p>
            </div>
          </div>

          {/* Card 3: Evaluation & Feedback */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-start space-x-4 hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Evaluation & Feedback
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive instructor reviews and actionable feedback to improve.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
