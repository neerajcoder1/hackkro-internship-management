import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { taskService, submissionService, authService } from '../services/api.js';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import NotificationBanner from '../components/ui/NotificationBanner.jsx';
import {
  Home,
  Users,
  ClipboardList,
  PlusCircle,
  Clock,
  CheckCircle2,
  FileCheck,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit,
  Trash2,
  AlertCircle,
  ChevronRight,
  Send,
  Award,
} from 'lucide-react';

export default function AdminPortal() {
  const { user } = useAuth();

  // Primary Data
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, interns, tasks, submissions, history

  // Notifications
  const [notification, setNotification] = useState(null);

  // Task Creation Modal State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    taskType: 'daily',
    assignedTo: '',
    deadline: '',
    maxPoints: 100,
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskFormError, setTaskFormError] = useState('');

  // Task Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskSubmitting, setEditingTaskSubmitting] = useState(false);

  // Submission Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    pointsAwarded: 100,
    feedback: '',
  });
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // History Removal Modal States
  const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  // Fetch all admin datasets
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [tasksRes, subsRes, internsRes] = await Promise.all([
        taskService.getAllTasks(),
        submissionService.getAllSubmissions(),
        authService.getInterns(),
      ]);

      setTasks(tasksRes.data || []);
      setSubmissions(subsRes.data || []);
      setInterns(internsRes.data || []);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to fetch admin datasets',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute real dashboard statistics
  const stats = useMemo(() => {
    const totalInterns = interns.length;
    const totalTasks = tasks.length;
    const pendingReviews = submissions.filter((s) => s.status === 'submitted').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalPointsAwarded = submissions
      .filter((s) => s.status === 'approved')
      .reduce((acc, s) => acc + (s.pointsAwarded || 0), 0);

    return {
      totalInterns,
      totalTasks,
      pendingReviews,
      completedTasks,
      totalPointsAwarded,
    };
  }, [interns, tasks, submissions]);

  // Compute intern performance breakdown
  const internPerformance = useMemo(() => {
    return interns.map((intern) => {
      const internTasks = tasks.filter(
        (t) => t.assignedTo?._id === intern._id || t.assignedTo === intern._id
      );
      const internSubs = submissions.filter(
        (s) => s.intern?._id === intern._id || s.intern === intern._id
      );
      const approvedSubs = internSubs.filter((s) => s.status === 'approved');
      const points = approvedSubs.reduce((acc, s) => acc + (s.pointsAwarded || 0), 0);

      return {
        ...intern,
        assignedCount: internTasks.length,
        submittedCount: internSubs.length,
        approvedCount: approvedSubs.length,
        totalPoints: points,
        completionRate:
          internTasks.length > 0
            ? Math.round((approvedSubs.length / internTasks.length) * 100)
            : 0,
      };
    });
  }, [interns, tasks, submissions]);

  // Handle Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskFormError('');

    if (!taskForm.title.trim() || !taskForm.description.trim() || !taskForm.assignedTo || !taskForm.deadline) {
      setTaskFormError('All fields are required.');
      return;
    }

    try {
      setCreatingTask(true);
      await taskService.createTask({
        ...taskForm,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        maxPoints: Number(taskForm.maxPoints) || 100,
      });

      setNotification({
        type: 'success',
        message: `Task "${taskForm.title}" created and assigned successfully!`,
      });
      setIsCreateTaskModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        taskType: 'daily',
        assignedTo: '',
        deadline: '',
        maxPoints: 100,
      });
      fetchAllData();
    } catch (err) {
      setTaskFormError(err.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  // Handle Task Delete
  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Are you sure you want to delete task "${taskTitle}"? Associated submissions will also be removed.`)) {
      return;
    }

    try {
      await taskService.deleteTask(taskId);
      setNotification({
        type: 'success',
        message: `Task "${taskTitle}" deleted successfully.`,
      });
      fetchAllData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete task',
      });
    }
  };

  // Open Edit Task Modal
  const handleOpenEditTask = (task) => {
    setEditingTask({
      _id: task._id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      status: task.status,
      maxPoints: task.maxPoints,
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
    });
    setIsEditModalOpen(true);
  };

  // Save Task Edits
  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setEditingTaskSubmitting(true);
      await taskService.updateTask(editingTask._id, {
        title: editingTask.title,
        description: editingTask.description,
        taskType: editingTask.taskType,
        status: editingTask.status,
        maxPoints: Number(editingTask.maxPoints),
        deadline: editingTask.deadline,
      });

      setNotification({
        type: 'success',
        message: `Task "${editingTask.title}" updated successfully!`,
      });
      setIsEditModalOpen(false);
      fetchAllData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update task',
      });
    } finally {
      setEditingTaskSubmitting(false);
    }
  };

  // Open Review Submission Modal
  const handleOpenReview = (submission) => {
    setSelectedSubmission(submission);
    setReviewForm({
      status: 'approved',
      pointsAwarded: submission.task?.maxPoints || 100,
      feedback: submission.feedback || '',
    });
    setReviewError('');
    setIsReviewModalOpen(true);
  };

  // Submit Review (Approve / Reject)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setReviewError('');

    const maxLimit = selectedSubmission.task?.maxPoints || 100;
    if (reviewForm.status === 'approved') {
      const pts = Number(reviewForm.pointsAwarded);
      if (isNaN(pts) || pts < 0) {
        setReviewError('Points awarded must be a positive number.');
        return;
      }
      if (pts > maxLimit) {
        setReviewError(`Points awarded (${pts}) cannot exceed the task maximum (${maxLimit}).`);
        return;
      }
    }

    try {
      setReviewing(true);
      await submissionService.reviewSubmission(selectedSubmission._id, {
        status: reviewForm.status,
        pointsAwarded: reviewForm.status === 'approved' ? Number(reviewForm.pointsAwarded) : 0,
        feedback: reviewForm.feedback.trim(),
      });

      setNotification({
        type: 'success',
        message: `Submission for "${selectedSubmission.task?.title}" recorded as ${reviewForm.status.toUpperCase()}!`,
      });
      setIsReviewModalOpen(false);
      fetchAllData();
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  // Open confirmation modal to remove single history item
  const handleConfirmDeleteHistory = (sub) => {
    setHistoryToDelete(sub);
    setIsDeleteHistoryModalOpen(true);
  };

  // Execute deletion of single history item from admin view
  const handleExecuteDeleteHistory = async () => {
    if (!historyToDelete) return;
    try {
      setIsDeletingHistory(true);
      await submissionService.hideHistoryItem(historyToDelete._id);
      setNotification({
        type: 'success',
        message: 'Evaluation record removed from your admin view.',
      });
      setIsDeleteHistoryModalOpen(false);
      setHistoryToDelete(null);
      fetchAllData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to remove history record.',
      });
    } finally {
      setIsDeletingHistory(false);
    }
  };

  // Execute clear-all history from admin view
  const handleExecuteClearHistory = async () => {
    try {
      setIsClearingHistory(true);
      await submissionService.clearAllHistory();
      setNotification({
        type: 'success',
        message: 'All evaluation history has been removed from your admin view.',
      });
      setIsClearHistoryModalOpen(false);
      fetchAllData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to clear evaluation history.',
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'interns', label: 'Interns', icon: Users, badge: interns.length },
    { id: 'tasks', label: 'All Tasks', icon: ClipboardList, badge: tasks.length },
    {
      id: 'assign',
      label: 'Assign Task',
      icon: PlusCircle,
    },
    {
      id: 'submissions',
      label: 'Pending Reviews',
      icon: Clock,
      badge: stats.pendingReviews,
      isAlert: stats.pendingReviews > 0,
    },
    { id: 'history', label: 'Evaluation History', icon: FileCheck },
  ];

  const handleTabSelect = (tabId) => {
    if (tabId === 'assign') {
      setIsCreateTaskModalOpen(true);
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <DashboardLayout
      user={user}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={handleTabSelect}
      actions={
        <button
          onClick={fetchAllData}
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

        {loading && !tasks.length && !interns.length ? (
          <div className="py-24 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">Loading administrative console...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Admin Overview
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage interns, tasks, submissions and evaluations.
                  </p>
                </div>

                {/* 4 Stat Cards in a row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Interns"
                    value={stats.totalInterns}
                    icon={Users}
                    variant="blue"
                  />
                  <StatCard
                    label="Total Tasks"
                    value={stats.totalTasks}
                    icon={ClipboardList}
                    variant="slate"
                  />
                  <StatCard
                    label="Pending Reviews"
                    value={stats.pendingReviews}
                    icon={Clock}
                    variant={stats.pendingReviews > 0 ? 'amber' : 'slate'}
                  />
                  <StatCard
                    label="Total Points"
                    value={stats.totalPointsAwarded}
                    icon={Award}
                    variant="amber"
                  />
                </div>

                {/* Two-Column Grid: Recent Submissions (Left) + Quick Actions (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Recent Submissions Table (2 Cols on lg) */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">
                            Recent Submissions
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Latest task submissions from interns
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('submissions')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <span>View All</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {submissions.length === 0 ? (
                        <div className="py-16 text-center text-slate-500">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-slate-800">Inbox Zero</h4>
                          <p className="text-xs text-slate-500 mt-1">No submissions currently in the system.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                              <tr>
                                <th className="px-5 py-3">Intern</th>
                                <th className="px-5 py-3">Task</th>
                                <th className="px-5 py-3">Submitted At</th>
                                <th className="px-5 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {submissions.slice(0, 5).map((sub) => (
                                <tr
                                  key={sub._id}
                                  onClick={() => handleOpenReview(sub)}
                                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                                >
                                  <td className="px-5 py-3.5 flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                                      {sub.intern?.name?.charAt(0).toUpperCase() || 'I'}
                                    </div>
                                    <span className="font-semibold text-slate-900 truncate max-w-[130px]">
                                      {sub.intern?.name}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[180px] truncate">
                                    {sub.task?.title || 'Unknown Task'}
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                    {new Date(sub.submittedAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <StatusBadge status={sub.status} size="xs" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Quick Actions Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 mb-4">
                        Quick Actions
                      </h2>

                      <div className="space-y-3">
                        <button
                          onClick={() => setIsCreateTaskModalOpen(true)}
                          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Assign New Task</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('submissions')}
                          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>Review Submissions ({stats.pendingReviews})</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('interns')}
                          className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>Manage Interns ({stats.totalInterns})</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                      <span>Tasks: <strong className="text-slate-800">{stats.totalTasks}</strong></span>
                      <span>Evaluated: <strong className="text-emerald-600">{stats.completedTasks}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INTERNS DIRECTORY */}
            {activeTab === 'interns' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Intern Directory</h2>
                    <p className="text-xs text-slate-500">Cohort members, completed tasks, and cumulative points awarded</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    {interns.length} Cohort Members
                  </span>
                </div>

                {internPerformance.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                    No intern accounts registered yet.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Intern Name</th>
                            <th className="px-5 py-3.5">Email</th>
                            <th className="px-5 py-3.5">Assigned</th>
                            <th className="px-5 py-3.5">Submissions</th>
                            <th className="px-5 py-3.5">Approved</th>
                            <th className="px-5 py-3.5">Total Points</th>
                            <th className="px-5 py-3.5">Completion Rate</th>
                            <th className="px-5 py-3.5 text-right">Quick Dispatch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {internPerformance.map((intern) => (
                            <tr key={intern._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4 font-semibold text-slate-900 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                                  {intern.name?.charAt(0).toUpperCase()}
                                </div>
                                <span>{intern.name}</span>
                              </td>
                              <td className="px-5 py-4 text-slate-500 font-mono">
                                {intern.email}
                              </td>
                              <td className="px-5 py-4 font-mono font-medium">
                                {intern.assignedCount}
                              </td>
                              <td className="px-5 py-4 font-mono text-slate-600">
                                {intern.submittedCount}
                              </td>
                              <td className="px-5 py-4 font-mono text-emerald-700 font-semibold">
                                {intern.approvedCount}
                              </td>
                              <td className="px-5 py-4 font-mono font-bold text-blue-700 text-sm">
                                {intern.totalPoints} pts
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${Math.min(intern.completionRate, 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-[11px] text-slate-500 font-medium">
                                    {intern.completionRate}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setTaskForm((prev) => ({ ...prev, assignedTo: intern._id }));
                                    setIsCreateTaskModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-600 font-semibold rounded border border-blue-200 text-xs transition-colors cursor-pointer"
                                >
                                  Assign Task
                                </button>
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

            {/* TAB 3: ALL TASKS */}
            {activeTab === 'tasks' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">All Assigned Tasks</h2>
                    <p className="text-xs text-slate-500">Manage, edit, and track daily and weekly milestone assignments</p>
                  </div>
                  <button
                    onClick={() => setIsCreateTaskModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Task</span>
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500 text-sm mb-3">No assignments created yet.</p>
                    <button
                      onClick={() => setIsCreateTaskModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Create First Assignment
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Title & Description</th>
                            <th className="px-5 py-3.5">Type</th>
                            <th className="px-5 py-3.5">Assigned Intern</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5">Max Score</th>
                            <th className="px-5 py-3.5">Deadline</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {tasks.map((task) => (
                            <tr key={task._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-900 max-w-xs truncate">{task.title}</p>
                                <p className="text-[11px] text-slate-500 truncate max-w-xs">{task.description}</p>
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge status={task.taskType} size="xs" />
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-medium text-slate-900">{task.assignedTo?.name || 'Unassigned'}</span>
                                <span className="block text-[11px] font-mono text-slate-500">{task.assignedTo?.email}</span>
                              </td>
                              <td className="px-5 py-4">
                                <StatusBadge status={task.status} size="xs" />
                              </td>
                              <td className="px-5 py-4 font-mono font-bold text-blue-700">
                                {task.maxPoints} pts
                              </td>
                              <td className="px-5 py-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                                {new Date(task.deadline).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 text-xs transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3 h-3 text-slate-500" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id, task.title)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 rounded border border-red-200 text-xs transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                  <span>Delete</span>
                                </button>
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

            {/* TAB 4: PENDING REVIEWS */}
            {activeTab === 'submissions' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Pending Reviews</h2>
                    <p className="text-xs text-slate-500">Submissions awaiting instructor code evaluation and scoring</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    {submissions.filter((s) => s.status === 'submitted').length} Pending
                  </span>
                </div>

                {submissions.filter((s) => s.status === 'submitted').length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    All submissions evaluated! Inbox zero.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Intern</th>
                            <th className="px-5 py-3.5">Task Title</th>
                            <th className="px-5 py-3.5">Repository</th>
                            <th className="px-5 py-3.5">Submitted</th>
                            <th className="px-5 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {submissions
                            .filter((s) => s.status === 'submitted')
                            .map((sub) => (
                              <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-4">
                                  <span className="font-semibold text-slate-900 block">{sub.intern?.name}</span>
                                  <span className="text-[11px] font-mono text-slate-500">{sub.intern?.email}</span>
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-900 max-w-xs truncate">
                                  {sub.task?.title || 'Unknown Task'}
                                </td>
                                <td className="px-5 py-4">
                                  <a
                                    href={sub.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 font-mono inline-flex items-center gap-1 max-w-[180px] truncate"
                                  >
                                    <span className="truncate">{sub.githubUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </a>
                                </td>
                                <td className="px-5 py-4 text-slate-500 font-mono whitespace-nowrap text-[11px]">
                                  {new Date(sub.submittedAt).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <button
                                    onClick={() => handleOpenReview(sub)}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                                  >
                                    Review Now
                                  </button>
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

            {/* TAB 5: EVALUATION HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Evaluation History</h2>
                    <p className="text-xs text-slate-500">Record of all reviewed submissions and awarded points</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-semibold text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                      {submissions.filter((s) => s.isEvaluated).length} Reviewed
                    </span>
                    {submissions.filter((s) => s.isEvaluated).length > 0 && (
                      <button
                        onClick={() => setIsClearHistoryModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-xs"
                        title="Clear all evaluation history records from your admin view"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Clear History</span>
                      </button>
                    )}
                  </div>
                </div>

                {submissions.filter((s) => s.isEvaluated).length === 0 ? (
                  <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
                    No evaluations completed yet.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                          <tr>
                            <th className="px-5 py-3.5">Intern</th>
                            <th className="px-5 py-3.5">Task Title</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5">Points</th>
                            <th className="px-5 py-3.5">Feedback</th>
                            <th className="px-5 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {submissions
                            .filter((s) => s.isEvaluated)
                            .map((sub) => (
                              <tr key={sub._id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-4">
                                  <span className="font-semibold text-slate-900 block">{sub.intern?.name}</span>
                                  <span className="text-[11px] font-mono text-slate-500">{sub.intern?.email}</span>
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-900 max-w-xs truncate">
                                  {sub.task?.title || 'Unknown Task'}
                                </td>
                                <td className="px-5 py-4">
                                  <StatusBadge status={sub.status} size="xs" />
                                </td>
                                <td className="px-5 py-4 font-mono">
                                  <span className="font-bold text-emerald-700">
                                    {sub.pointsAwarded} / {sub.task?.maxPoints || 100} pts
                                  </span>
                                </td>
                                <td className="px-5 py-4 max-w-xs text-slate-700 italic truncate">
                                  "{sub.feedback || 'Good work'}"
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenReview(sub)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                                    >
                                      Re-examine
                                    </button>
                                    <button
                                      onClick={() => handleConfirmDeleteHistory(sub)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                      title="Remove from my history view"
                                      aria-label="Delete history record"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-500" />
                                    </button>
                                  </div>
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
          </>
        )}

        {/* CREATE TASK MODAL */}
        <Modal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          title="Create & Assign Milestone"
        >
          <form onSubmit={handleCreateTask} className="space-y-4">
            {taskFormError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{taskFormError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g. Implement Resend Automated Notification Service"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Deliverable Acceptance Criteria <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Outline objectives, acceptance criteria, and deliverable format..."
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={taskForm.taskType}
                  onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="daily">Daily Task</option>
                  <option value="weekly">Weekly Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign To Intern <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">-- Select Intern --</option>
                  {interns.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Points <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={taskForm.maxPoints}
                  onChange={(e) => setTaskForm({ ...taskForm, maxPoints: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateTaskModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingTask}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {creatingTask ? 'Creating...' : 'Assign Milestone'}
              </button>
            </div>
          </form>
        </Modal>

        {/* EDIT TASK MODAL */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Assignment"
        >
          {editingTask && (
            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
                  <select
                    value={editingTask.taskType}
                    onChange={(e) => setEditingTask({ ...editingTask, taskType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs outline-none"
                  >
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs outline-none"
                  >
                    <option value="pending">pending</option>
                    <option value="in-progress">in-progress</option>
                    <option value="submitted">submitted</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Points</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTask.maxPoints}
                    onChange={(e) => setEditingTask({ ...editingTask, maxPoints: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={editingTask.deadline}
                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingTaskSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  {editingTaskSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* REVIEW & EVALUATION MODAL */}
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Evaluate Code Deliverable"
        >
          {selectedSubmission && (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {reviewError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Intern:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSubmission.intern?.name} ({selectedSubmission.intern?.email})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Milestone:</span>
                  <span className="font-semibold text-slate-900">{selectedSubmission.task?.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Maximum Points:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {selectedSubmission.task?.maxPoints} pts
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">GitHub Link:</span>
                  <a
                    href={selectedSubmission.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-mono inline-flex items-center gap-1 truncate max-w-[240px]"
                  >
                    <span className="truncate">{selectedSubmission.githubUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
                {selectedSubmission.submissionNotes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-0.5 font-semibold">Developer Notes:</span>
                    <p className="text-slate-700 italic">"{selectedSubmission.submissionNotes}"</p>
                  </div>
                )}
              </div>

              {/* Decision Controls */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Evaluation Decision <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      reviewForm.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve & Award</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })}
                    className={`py-2.5 px-4 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      reviewForm.status === 'rejected'
                        ? 'bg-red-50 text-red-800 border-red-300 ring-2 ring-red-400/20'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Request Revision</span>
                  </button>
                </div>
              </div>

              {reviewForm.status === 'approved' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Points to Allocate (Max: {selectedSubmission.task?.maxPoints || 100}){' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedSubmission.task?.maxPoints || 100}
                    required
                    value={reviewForm.pointsAwarded}
                    onChange={(e) => setReviewForm({ ...reviewForm, pointsAwarded: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructor Feedback & Review Comments
                </label>
                <textarea
                  rows={3}
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                  placeholder="Provide constructive review comments, architecture suggestions, or praise..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{reviewing ? 'Publishing Evaluation...' : 'Publish Evaluation'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* SINGLE HISTORY RECORD REMOVAL CONFIRMATION MODAL */}
        <Modal
          isOpen={isDeleteHistoryModalOpen}
          onClose={() => {
            if (!isDeletingHistory) {
              setIsDeleteHistoryModalOpen(false);
              setHistoryToDelete(null);
            }
          }}
          title="Remove History Record"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <span className="font-bold block mb-1">Admin-Only View Removal</span>
              This will remove this record <strong>only from your personal admin history view</strong>. The intern's grade, earned points, feedback, and submission record remain completely untouched and visible in the intern dashboard.
            </div>

            {historyToDelete && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Intern:</span>
                  <span className="font-semibold text-slate-900">{historyToDelete.intern?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Task:</span>
                  <span className="font-semibold text-slate-900">{historyToDelete.task?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Awarded Points:</span>
                  <span className="font-mono font-bold text-emerald-700">{historyToDelete.pointsAwarded} pts</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingHistory}
                onClick={() => {
                  setIsDeleteHistoryModalOpen(false);
                  setHistoryToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingHistory}
                onClick={handleExecuteDeleteHistory}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingHistory ? 'Removing...' : 'Remove from My View'}</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* CLEAR ALL HISTORY CONFIRMATION MODAL */}
        <Modal
          isOpen={isClearHistoryModalOpen}
          onClose={() => {
            if (!isClearingHistory) setIsClearHistoryModalOpen(false);
          }}
          title="Clear Evaluation History"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed">
              <span className="font-bold block mb-1">Clear All Admin History</span>
              Are you sure you want to clear your evaluation history? All currently evaluated submissions will disappear <strong>only from your personal admin view</strong>. Interns will continue seeing all their completed assignments, feedback, and total points unaffected.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={() => setIsClearHistoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingHistory}
                onClick={handleExecuteClearHistory}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearingHistory ? 'Clearing...' : 'Clear All History'}</span>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
