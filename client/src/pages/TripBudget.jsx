import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getBudgetSummaryApi,
  addExpenseApi,
  updateExpenseApi,
  deleteExpenseApi,
  updateBudgetLimitApi,
} from '../services/api';
import Navbar from '../components/Navbar';
import BudgetChart from '../components/BudgetChart';
import ExpenseModal from '../components/ExpenseModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  Compass,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Users,
} from 'lucide-react';

export default function TripBudget() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  // Budget Limit Input State
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [budgetLimitInput, setBudgetLimitInput] = useState('');

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Delete Expense Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchBudget = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getBudgetSummaryApi(id);
      if (response.success) {
        setData(response);
        setBudgetLimitInput(response.metrics?.budgetLimit || '');
      }
    } catch (err) {
      console.error('[TripBudget fetch error]:', err);
      setError(err.message || 'Failed to load budget summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBudget();
  }, [id]);

  const showFeedback = (msg) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  // Submit Budget Limit
  const handleSaveBudgetLimit = async () => {
    try {
      const res = await updateBudgetLimitApi(id, Number(budgetLimitInput));
      if (res.success) {
        showFeedback('Budget limit updated');
        setIsEditingLimit(false);
        fetchBudget();
      }
    } catch (err) {
      console.error('[Update budget limit error]:', err);
      alert(err.message || 'Failed to update budget limit');
    }
  };

  // Submit Add / Edit Expense
  const handleExpenseSubmit = async (formData) => {
    setModalSubmitting(true);
    try {
      if (editingExpense) {
        const res = await updateExpenseApi(id, editingExpense._id, formData);
        if (res.success) {
          showFeedback('Expense record updated');
          fetchBudget();
        }
      } else {
        const res = await addExpenseApi(id, formData);
        if (res.success) {
          showFeedback('Expense added to budget');
          fetchBudget();
        }
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
    } catch (err) {
      console.error('[Expense submit error]:', err);
      alert(err.message || 'Failed to save expense record');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpenseConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await deleteExpenseApi(id, deleteTarget._id);
      if (res.success) {
        showFeedback('Expense record removed');
        fetchBudget();
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('[Delete expense error]:', err);
      alert(err.message || 'Failed to delete expense record');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 0' }}>
        <div className="container">

          {/* Navigation & Header */}
          <div className="flex flex-col flex-md-row justify-between items-start items-md-center gap-4" style={{ marginBottom: '2rem' }}>
            <div>
              <Link to={`/trips/${id}`} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} />
                <span>Back to Trip Overview</span>
              </Link>
              <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                {data?.trip?.name || 'Trip Budget'} — Expense Analytics
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Track financial costs, category breakdown, daily averages, and set budget limits.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <Plus style={{ width: 18, height: 18 }} />
              <span>Record Expense</span>
            </button>
          </div>

          {/* Feedback Alert Banner */}
          {saveFeedback && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', itemsCenter: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              <span>{saveFeedback}</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle style={{ width: 20, height: 20 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Budget Limit Alert Banner */}
          {data?.metrics?.isOverBudget && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)' }}>
              <AlertTriangle style={{ width: 32, height: 32, color: '#ef4444', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.2rem' }}>
                  Budget Limit Exceeded Alert!
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
                  Your estimated trip costs ({formatCurrency(data.metrics.totalCost)}) exceed your set budget limit of {formatCurrency(data.metrics.budgetLimit)} by <span style={{ fontWeight: 800 }}>{formatCurrency(data.metrics.exceededAmount)}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Compass className="pulse-glow" style={{ width: 44, height: 44, color: '#3b82f6', margin: '0 auto 1rem auto' }} />
              <p style={{ fontFamily: 'var(--font-heading)' }}>Calculating budget analytics...</p>
            </div>
          ) : data ? (
            <div>
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 grid-cols-3 gap-6" style={{ marginBottom: '2.5rem' }}>
                
                {/* 1. Total Trip Cost */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.15)', width: 52, height: 52, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DollarSign style={{ width: 26, height: 26, color: '#60a5fa' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Estimated Cost</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                      {formatCurrency(data.metrics.totalCost)}
                    </h3>
                  </div>
                </div>

                {/* 2. Average Daily Cost */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', width: 52, height: 52, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp style={{ width: 26, height: 26, color: '#34d399' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Average Cost / Day</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                      {formatCurrency(data.metrics.averageCostPerDay)}
                      <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}> ({data.metrics.totalDays} Days)</span>
                    </h3>
                  </div>
                </div>

                {/* 3. Budget Limit Settings */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Target Budget Limit</span>
                    <button
                      onClick={() => setIsEditingLimit(!isEditingLimit)}
                      style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {isEditingLimit ? 'Cancel' : 'Set Limit'}
                    </button>
                  </div>

                  {isEditingLimit ? (
                    <div className="flex items-center gap-2" style={{ marginTop: '0.5rem' }}>
                      <input
                        type="number"
                        value={budgetLimitInput}
                        onChange={(e) => setBudgetLimitInput(e.target.value)}
                        placeholder="Set budget ($)..."
                        style={{ width: '100%', padding: '0.45rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                      />
                      <button onClick={handleSaveBudgetLimit} className="btn btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: data.metrics.isOverBudget ? '#ef4444' : 'var(--text-primary)', marginTop: '0.1rem' }}>
                      {data.metrics.budgetLimit > 0 ? formatCurrency(data.metrics.budgetLimit) : 'No Limit Set'}
                    </h3>
                  )}
                </div>

              </div>

              {/* Chart & Category Distribution */}
              <div style={{ marginBottom: '2.5rem' }}>
                <BudgetChart categories={data.categories} totalCost={data.metrics.totalCost} />
              </div>

              {/* Group Trip Expense Splitter ("Who Owes Whom") */}
              <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                  <div className="flex items-center gap-2">
                    <Users style={{ width: 22, height: 22, color: '#34d399' }} />
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Group Trip Expense Splitter</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Track group companion balances and automated settlement matrix ("Who Owes Whom")
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-success">Group Trip Active</span>
                </div>

                <div className="grid grid-cols-1 grid-cols-2 gap-6">
                  
                  {/* Companion Balances */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                      Traveler Balances
                    </h4>
                    <div className="flex flex-col gap-3">
                      {data.groupSplitter?.groupBalances?.map((bal) => (
                        <div key={bal.person} className="flex justify-between items-center" style={{ padding: '0.6rem 0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>{bal.person}</span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              Paid: ${bal.totalPaid} | Share: ${bal.totalShare}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ 
                              fontWeight: 800, 
                              fontSize: '0.95rem', 
                              color: bal.netBalance > 0 ? '#34d399' : bal.netBalance < 0 ? '#ef4444' : 'var(--text-secondary)' 
                            }}>
                              {bal.netBalance > 0 ? `+$${bal.netBalance}` : bal.netBalance < 0 ? `-$${Math.abs(bal.netBalance)}` : '$0.00'}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: bal.netBalance > 0 ? '#34d399' : bal.netBalance < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                              {bal.netBalance > 0 ? 'Gets back' : bal.netBalance < 0 ? 'Owes group' : 'Settled up'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settlement Matrix */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
                      Suggested Settlement ("Who Owes Whom")
                    </h4>
                    {data.groupSplitter?.settlements && data.groupSplitter.settlements.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {data.groupSplitter.settlements.map((set, idx) => (
                          <div key={idx} className="flex items-center justify-between" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontWeight: 700, color: '#fca5a5' }}>{set.from}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>owes</span>
                              <span style={{ fontWeight: 700, color: '#34d399' }}>{set.to}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#60a5fa', fontSize: '1rem' }}>
                              ${set.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        ✨ Everyone is fully settled up! No pending payments.
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Expense Records Table */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Recorded Expense Log</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Itemized financial record of expenses</p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setIsExpenseModalOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}
                  >
                    <Plus style={{ width: 14, height: 14 }} />
                    <span>Add Expense</span>
                  </button>
                </div>

                {data.expenses && data.expenses.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Paid By / Split</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Description</th>
                          <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expenses.map((exp) => (
                          <tr key={exp._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)' }}>{formatDate(exp.date)}</td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span className="badge badge-info">{exp.category}</span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: 700, color: '#34d399' }}>{exp.paidBy || 'You'}</span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
                                Split: {exp.splitAmong && exp.splitAmong.length > 0 ? exp.splitAmong.join(', ') : 'Self'}
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{exp.description || '—'}</td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                              ${exp.amount.toLocaleString()}
                              {exp.currency && exp.currency !== 'USD' && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                  ({exp.currency} {exp.originalAmount?.toLocaleString() || exp.amount})
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingExpense(exp);
                                    setIsExpenseModalOpen(true);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                                >
                                  <Edit3 style={{ width: 12, height: 12 }} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(exp)}
                                  className="btn"
                                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                                >
                                  <Trash2 style={{ width: 12, height: 12 }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                    <DollarSign style={{ width: 36, height: 36, color: 'var(--text-dimmed)', margin: '0 auto 0.75rem auto' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      No manual expense items recorded yet. Scheduled activity costs are calculated automatically.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : null}

        </div>
      </main>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleExpenseSubmit}
        initialData={editingExpense}
        travelers={data?.trip?.travelers}
        loading={modalSubmitting}
      />

      {/* Delete Expense Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Expense Record"
        message={`Are you sure you want to delete this expense record for ${deleteTarget?.category} ($${deleteTarget?.amount})?`}
        confirmText="Delete Expense"
        loading={deleting}
        onConfirm={handleDeleteExpenseConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
