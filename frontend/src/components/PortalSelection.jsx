import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Users,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

export default function PortalSelection({ className = '', id = '' }) {
  return (
    <section id={id || undefined} className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 ${className}`}>
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Role-Based Workspaces</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Choose Your Portal
        </h2>
        <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
          Select your dedicated workspace to continue. Access privileges and operational tools are strictly segregated based on verified roles.
        </p>
      </div>

      {/* Two Portal Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* OPTION 1: ADMIN / EMPLOYEE PORTAL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-200 group">
          <div>
            {/* Header Badge & Icon */}
            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                <Users className="w-3 h-3 text-slate-500" />
                <span>Program Directors & Staff</span>
              </span>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Admin / Employee Portal
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Manage interns, create and assign tasks, review submissions, evaluate performance, and manage points.
            </p>

            {/* Feature List */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-8">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Intern Roster Directory & Cohort Management</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Daily & Weekly Milestone Delegation with Points Caps</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Live Review Queue with External GitHub Repository Links</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Atomic Points Evaluation & Automated Notification Dispatch</span>
              </div>
            </div>
          </div>

          {/* Action & Notes */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/login?portal=admin"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer group/btn"
            >
              <span>Enter Admin / Employee Portal</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Requires authorized administrative or staff credentials.
            </p>
          </div>
        </div>

        {/* OPTION 2: INTERN PORTAL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-200 group">
          <div>
            {/* Header Badge & Icon */}
            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <GraduationCap className="w-3 h-3 text-blue-600" />
                <span>Candidates & Enrolled Interns</span>
              </span>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Intern Portal
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              View assigned tasks, submit completed work, track points, and review feedback.
            </p>

            {/* Feature List */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 mb-8">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Daily Deliverables & Weekly Project Milestones</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Validated Public GitHub Deliverable Submission & Notes</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Real-Time Cumulative Score Ledger & Progress Tracking</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Actionable Instructor Feedback & Milestone Revision Status</span>
              </div>
            </div>
          </div>

          {/* Action & Notes */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/login?portal=intern"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer group/btn"
            >
              <span>Enter Intern Workspace</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
            <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-slate-500">
              <span>New candidate?</span>
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
              >
                Register as an Intern &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
