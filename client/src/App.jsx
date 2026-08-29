import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import TransactionDetailModal from './components/TransactionDetailModal';
import HumanReviewModal from './components/HumanReviewModal';
import BatchAnalysisModal from './components/BatchAnalysisModal';
import StarfieldBackground from './components/StarfieldBackground';

import OverviewPage from './pages/OverviewPage';
import TransactionsPage from './pages/TransactionsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import HumanReviewPage from './pages/HumanReviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditTrailPage from './pages/AuditTrailPage';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  // Shared Global Data
  const [stats, setStats] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [failureReasons, setFailureReasons] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const [reviewMeta, setReviewMeta] = useState({ actionId: null, transactionId: null });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchGlobalData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [statsRes, oppsRes, pmRes, frRes, actionsRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getOpportunities(),
        api.getPaymentMethodAnalytics(),
        api.getFailureReasonAnalytics(),
        api.getRecoveryActions({ limit: 10 })
      ]);

      setStats(statsRes.summary);
      setOpportunities(oppsRes.opportunities || []);
      setPaymentMethods(pmRes.data || []);
      setFailureReasons(frRes.data || []);
      setRecentActions(actionsRes.data || []);
      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error('Failed to load global data:', err);
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData, refreshTrigger]);

  const handleSelectTransaction = (txId) => {
    setSelectedTxId(txId);
    setIsTxModalOpen(true);
  };

  const handleOpenReviewModal = (actionId, txId) => {
    setReviewMeta({ actionId, transactionId: txId });
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleBatchAnalysisComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen space-bg text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Background Cyber Ambient Particles */}
      <StarfieldBackground />

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        humanReviewCount={stats?.human_review_count || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          stats={stats}
          onRefresh={() => fetchGlobalData()}
          isRefreshing={isRefreshing}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewPage
              stats={stats}
              opportunities={opportunities}
              paymentMethods={paymentMethods}
              failureReasons={failureReasons}
              recentActions={recentActions}
              loading={loading}
              onSelectTransaction={handleSelectTransaction}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsPage onSelectTransaction={handleSelectTransaction} />
          )}

          {activeTab === 'opportunities' && (
            <OpportunitiesPage
              onSelectTransaction={handleSelectTransaction}
              onOpenReviewModal={handleOpenReviewModal}
            />
          )}

          {activeTab === 'human-review' && (
            <HumanReviewPage
              onSelectTransaction={handleSelectTransaction}
              onOpenReviewModal={handleOpenReviewModal}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'audit-trail' && (
            <AuditTrailPage onSelectTransaction={handleSelectTransaction} />
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <TransactionDetailModal
        transactionId={selectedTxId}
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setSelectedTxId(null);
        }}
        onOpenReviewModal={handleOpenReviewModal}
      />

      <HumanReviewModal
        actionId={reviewMeta.actionId}
        transactionId={reviewMeta.transactionId}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewMeta({ actionId: null, transactionId: null });
        }}
        onSuccess={handleReviewSuccess}
      />

      <BatchAnalysisModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onAnalysisComplete={handleBatchAnalysisComplete}
      />
    </div>
  );
}
