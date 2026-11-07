import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { taskService, submissionService } from '../services/api.js';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import NotificationBanner from '../components/ui/NotificationBanner.jsx';
import {
  Home,
  ClipboardList,
  Clock,
  Calendar,
  FolderGit2,
  Award,
  User,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  MessageSquare,
  Mail,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function InternPortal() {
  const { user } = useAuth();

  // State
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Notification state
  const [notification, setNotification] = useState(null);

  // Selected task for modal / submission
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch all intern data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, subsRes, pointsRes] = await Promise.all([
        taskService.getMyTasks(),
        submissionService.getMySubmissions(),
        submissionService.getMyPoints(),
      ]);

      setTasks(tasksRes.data || []);
      setSubmissions(subsRes.data || []);
      setPointsData(pointsRes.data || null);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter tasks
  const dailyTasks = useMemo(() => tasks.filter((t) => t.taskType === 'daily'), [tasks]);
  const weeklyTasks = useMemo(() => tasks.filter((t) => t.taskType === 'weekly'), [tasks]);
  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'completed'), [tasks]);

  // Derived real statistics
  const stats = useMemo(() => {
    const totalAssigned = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const submittedTasks = tasks.filter((t) => t.status === 'submitted').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in-progress').length;
    const totalPoints = pointsData?.totalPoints || 0;
    const approvedSubmissions = pointsData?.approvedSubmissionsCount || 0;
    const completionRate = totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0;

    return {
      totalAssigned,
      completedTasks,
      submittedTasks,
      pendingTasks,
      totalPoints,
      approvedSubmissions,
      completionRate,
    };
  }, [tasks, pointsData]);

  // Open submit modal for a specific task
  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setGithubUrl('');
    setSubmissionNotes('');
    setSubmitError('');
    setIsSubmitModalOpen(true);
  };

  // Submit GitHub work
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmitError('');
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/.*)?$/;
    if (!githubRegex.test(githubUrl.trim())) {
      setSubmitError('Please enter a valid GitHub repository or pull request URL (e.g. https://github.com/org/repo)');
      return;
    }

    try {
      setSubmitting(true);
      await submissionService.submitTask({
        taskId: selectedTask._id,
        githubUrl: githubUrl.trim(),
        submissionNotes: submissionNotes.trim(),
      });

      setNotification({
        type: 'success',
        message: `Task "${selectedTask.title}" submitted successfully for admin evaluation!`,
      });
      setIsSubmitModalOpen(false);
      fetchData();
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'tasks', label: 'My Tasks', icon: ClipboardList, badge: tasks.length },
    { id: 'daily', label: 'Daily Tasks', icon: Clock, badge: dailyTasks.length },
    { id: 'weekly', label: 'Weekly Tasks', icon: Calendar, badge: weeklyTasks.length },
    { id: 'submissions', label: 'Submissions', icon: FolderGit2, badge: submissions.length },
    { id: 'points', label: 'Points & Scores', icon: Award },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <DashboardLayout
      user={user}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Global Notification Banner */}
        <NotificationBanner
          type={notification?.type}
          message={notification?.message}
          onDismiss={() => setNotification(null)}
        />

        {loading && !tasks.length ? (
          <div className="py-24 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">Loading internship workspace...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Header */}
                <div className="mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>👋</span> Welcome back, {user?.name}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Here's your internship progress at a glance.
                  </p>
                </div>

                {/* 4 Stat Cards in a row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Points Earned"
                    value={stats.totalPoints}
                    icon={Award}
                    variant="amber"
                  />
                  <StatCard
                    label="Assigned Tasks"
                    value={stats.totalAssigned}
                    icon={Calendar}
                    variant="blue"
                  />
                  <StatCard
                    label="In Review"
                    value={stats.submittedTasks}
                    icon={Clock}
                    variant="indigo"
                  />
                  <StatCard
                    label="Completed"
                    value={stats.completedTasks}
                    icon={CheckCircle2}
                    variant="emerald"
                  />
                </div>

                {/* Two-Column Grid: Active Tasks (Left) + Overall Progress (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Active Tasks (2 Cols on lg) */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Active Tasks
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tasks currently in your queue
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('tasks')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {activeTasks.length === 0 ? (
                        <div className="py-16 text-center text-slate-500">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                            <ClipboardList className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">No active tasks</h4>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            You don't have any pending assignments right now.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {activeTasks.slice(0, 4).map((task) => (
                            <div
                              key={task._id}
                              className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={task.taskType} size="xs" />
                                  <StatusBadge status={task.status} size="xs" />
                                  <span className="text-xs font-semibold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                    {task.maxPoints} pts
                                  </span>
                                </div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                  {task.title}
                                </h3>
                                <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                                  {task.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(task.deadline).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={() => handleOpenTask(task)}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                >
                                  {task.status === 'submitted' ? 'View' : 'Submit'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Overall Progress Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between items-center text-center">
                    <div className="w-full text-left mb-4">
                      <h2 className="text-base font-bold text-slate-900">
                        Overall Progress
                      </h2>
                    </div>

                    <div className="py-4 flex flex-col items-center justify-center">
                      {/* Radial Progress Ring */}
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="text-slate-100"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="text-blue-600 transition-all duration-700 ease-out"
                            strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.completionRate / 100)}`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold font-mono text-slate-900">
                            {stats.completionRate}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-xs font-semibold text-slate-700">
                          Tasks Completed
                        </p>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">
                          {stats.completedTasks} of {stats.totalAssigned}
                        </p>
                      </div>
                    </div>

                    <div className="w-full pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                      <span>Points: <strong className="text-slate-900">{stats.totalPoints}</strong></span>
                      <span>Approved: <strong className="text-emerald-600">{stats.approvedSubmissions}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MY TASKS (ALL TASKS) */}
            {activeTab === 'tasks' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">All Assigned Tasks</h2>
                    <p className="text-xs text-slate-500">Complete curriculum of assigned tasks</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    {tasks.length} Total
                  </span>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                    No tasks assigned yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={task.taskType} size="xs" />
                              <StatusBadge status={task.status} size="xs" />
                            </div>
                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {task.maxPoints} pts
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mb-1.5">{task.title}</h3>
                          <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleOpenTask(task)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            {task.status === 'completed'
                              ? 'Completed'
                              : task.status === 'submitted'
                              ? 'Under Review'
                              : 'Submit Solution'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DAILY TASKS */}
            {activeTab === 'daily' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Daily Tasks</h2>
                    <p className="text-xs text-slate-500">Short-cycle daily assignments designed for continuous development</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    {dailyTasks.length} Total
                  </span>
                </div>

                {dailyTasks.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                    No daily assignments assigned yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dailyTasks.map((task) => (
                      <div
                        key={task._id}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <StatusBadge status={task.status} size="xs" />
                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {task.maxPoints} pts
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mb-1.5">{task.title}</h3>
                          <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleOpenTask(task)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            {task.status === 'completed'
                              ? 'Completed'
                              : task.status === 'submitted'
                              ? 'Under Review'
                              : 'Submit Solution'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: WEEKLY TASKS */}
            {activeTab === 'weekly' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Weekly Milestones</h2>
                    <p className="text-xs text-slate-500">Comprehensive deliverables and architecture milestones</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    {weeklyTasks.length} Total
                  </span>
                </div>

                {weeklyTasks.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                    No weekly milestones assigned yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeklyTasks.map((task) => (
                      <div
                        key={task._id}
                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <StatusBadge status={task.status} size="xs" />
                            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              {task.maxPoints} pts
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mb-1.5">{task.title}</h3>
                          <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleOpenTask(task)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            {task.status === 'completed'
                              ? 'Completed'
                              : task.status === 'submitted'
                              ? 'Under Review'
                              : 'Submit Solution'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SUBMISSION HISTORY */}
            {activeTab === 'submissions' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Submissions History</h2>
                    <p className="text-xs text-slate-500">Record of submitted deliverables and evaluations</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    {submissions.length} Total
                  </span>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                    You haven't submitted any tasks yet.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Task Title</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5">Repository URL</th>
                            <th className="px-5 py-3.5">Points</th>
                            <th className="px-5 py-3.5">Submitted</th>
                            <th className="px-5 py-3.5">Evaluation Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {submissions.map((sub) => (
                            <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4 font-semibold text-slate-900 max-w-xs truncate">
                                {sub.task?.title || 'Unknown Task'}
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge status={sub.status} size="xs" />
                              </td>
                              <td className="px-5 py-4">
                                <a
                                  href={sub.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-mono inline-flex items-center gap-1 max-w-[200px] truncate"
                                >
                                  <span className="truncate">{sub.githubUrl}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </td>
                              <td className="px-5 py-4 font-mono font-bold">
                                {sub.isEvaluated ? (
                                  <span className="text-emerald-700">
                                    {sub.pointsAwarded} / {sub.task?.maxPoints || 100}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Pending</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-slate-500 font-mono whitespace-nowrap text-[11px]">
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-4 max-w-xs">
                                {sub.feedback ? (
                                  <span className="text-slate-700 italic block truncate">"{sub.feedback}"</span>
                                ) : (
                                  <span className="text-slate-400">Awaiting evaluation</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: POINTS & SCORES */}
            {activeTab === 'points' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Total Points Earned"
                    value={pointsData?.totalPoints || 0}
                    subtext="Verified points from approved tasks"
                    icon={Award}
                    variant="amber"
                  />
                  <StatCard
                    label="Approved Submissions"
                    value={pointsData?.approvedSubmissionsCount || 0}
                    subtext="Completed assignments"
                    icon={CheckCircle2}
                    variant="emerald"
                  />
                  <StatCard
                    label="Total Submissions"
                    value={pointsData?.totalSubmissionsCount || 0}
                    subtext="Deliverables logged in repository"
                    icon={FolderGit2}
                    variant="blue"
                  />
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">
                    Points Breakdown
                  </h3>

                  {!pointsData?.breakdown || pointsData.breakdown.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No points recorded yet. Submit assignments to begin earning scores.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {pointsData.breakdown.map((item, index) => (
                        <div
                          key={item.submissionId || index}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <StatusBadge status={item.taskType} size="xs" />
                              <span className="text-slate-500 font-mono text-[11px]">
                                Evaluated: {new Date(item.reviewedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900">{item.taskTitle}</p>
                            {item.feedback && (
                              <p className="text-slate-500 italic mt-0.5">
                                Feedback: "{item.feedback}"
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-mono font-bold text-emerald-700">
                              +{item.pointsAwarded}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]"> / {item.maxPoints} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: PROFILE */}
            {activeTab === 'profile' && (
              <div className="max-w-[1100px] mx-auto space-y-6">
                {/* Page Heading */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    My Profile
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage your account and track your internship progress.
                  </p>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center space-x-5">
                      {/* Avatar with initials */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-xs border-2 border-white ring-2 ring-blue-100 shrink-0">
                        {user?.name
                          ? user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()
                          : 'IN'}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                            {user?.name || 'Intern'}
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{user?.role || 'intern'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active Account</span>
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 font-mono mt-1.5 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{user?.email}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Statistics (Four-Column Grid on Desktop) */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Performance Statistics
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Total Points"
                      value={stats.totalPoints}
                      subtext="Verified points awarded"
                      icon={Award}
                      variant="amber"
                    />
                    <StatCard
                      label="Completed Tasks"
                      value={stats.completedTasks}
                      subtext={`${stats.completedTasks} of ${stats.totalAssigned} completed`}
                      icon={CheckCircle2}
                      variant="emerald"
                    />
                    <StatCard
                      label="Completion Rate"
                      value={`${stats.completionRate}%`}
                      subtext="Milestone completion"
                      icon={TrendingUp}
                      variant="blue"
                    />
                    <StatCard
                      label="Assigned Tasks"
                      value={stats.totalAssigned}
                      subtext={`${dailyTasks.length} daily • ${weeklyTasks.length} weekly`}
                      icon={Calendar}
                      variant="indigo"
                    />
                  </div>
                </div>

                {/* Two-Column Information Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column 1: Personal Information */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
                          <p className="text-xs text-slate-500">Your registered contact and identity details</p>
                        </div>
                      </div>

                      <dl className="space-y-4 text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                          <dt className="text-slate-500 font-medium">Full Name</dt>
                          <dd className="text-slate-900 font-semibold mt-1 sm:mt-0">{user?.name}</dd>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                          <dt className="text-slate-500 font-medium">Email Address</dt>
                          <dd className="text-slate-900 font-mono text-xs mt-1 sm:mt-0">{user?.email}</dd>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                          <dt className="text-slate-500 font-medium">Role</dt>
                          <dd className="mt-1 sm:mt-0">
                            <span className="capitalize font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-xs">
                              {user?.role}
                            </span>
                          </dd>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
                          <dt className="text-slate-500 font-medium">Member ID</dt>
                          <dd className="text-slate-700 font-mono text-xs bg-slate-50 px-2.5 py-1 rounded border border-slate-200 mt-1 sm:mt-0">
                            {user?._id}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Column 2: Account Information */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2.5 pb-4 mb-5 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Account Information</h3>
                          <p className="text-xs text-slate-500">Internship enrollment and standing</p>
                        </div>
                      </div>

                      <dl className="space-y-4 text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                          <dt className="text-slate-500 font-medium">Account Status</dt>
                          <dd className="mt-1 sm:mt-0">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active & Verified</span>
                            </span>
                          </dd>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                          <dt className="text-slate-500 font-medium">Enrolled Since</dt>
                          <dd className="text-slate-900 font-medium mt-1 sm:mt-0">
                            {user?.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : 'Active Session'}
                          </dd>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-slate-50">
                          <dt className="text-slate-500 font-medium">Program Track</dt>
                          <dd className="text-slate-900 font-medium mt-1 sm:mt-0">
                            HackKro Software Internship Cohort
                          </dd>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1">
                          <dt className="text-slate-500 font-medium">Approved Deliverables</dt>
                          <dd className="text-emerald-700 font-mono font-bold mt-1 sm:mt-0">
                            {pointsData?.approvedSubmissionsCount || 0} Submissions
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* SUBMISSION MODAL */}
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title={selectedTask ? selectedTask.title : 'Task Details'}
        >
          {selectedTask && (
            <div className="space-y-4">
              {/* Task Specs */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedTask.taskType} size="xs" />
                  <StatusBadge status={selectedTask.status} size="xs" />
                  <span className="text-slate-600 font-mono font-semibold">
                    Max: {selectedTask.maxPoints} pts
                  </span>
                  <span className="text-slate-500 font-mono">
                    • Deadline: {new Date(selectedTask.deadline).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line pt-1">
                  {selectedTask.description}
                </p>
              </div>

              {/* If task is completed */}
              {selectedTask.status === 'completed' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Task Completed & Evaluated</p>
                    <p className="mt-0.5 text-slate-600">
                      This assignment has already been evaluated and points have been credited to your score.
                    </p>
                  </div>
                </div>
              )}

              {/* If task is submitted */}
              {selectedTask.status === 'submitted' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Submission Awaiting Review</p>
                    <p className="mt-0.5 text-slate-600">
                      Your work is queued for evaluation. You will receive an automated email notification once evaluated.
                    </p>
                  </div>
                </div>
              )}

              {/* Submission Form */}
              {(selectedTask.status === 'pending' ||
                selectedTask.status === 'in-progress' ||
                selectedTask.status === 'rejected') && (
                <form onSubmit={handleSubmitWork} className="space-y-4 pt-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Submit Solution Deliverable
                  </h4>

                  {submitError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GitHub Repository or Pull Request URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/organization/repository"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Must be a valid GitHub repository or pull request URL.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Submission Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Highlight key design decisions, run instructions, or unit test summaries..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Submitting...' : 'Submit Solution'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
