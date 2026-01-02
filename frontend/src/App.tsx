/**
 * Main Application Component
 * Wire Manufacturing Production Monitoring Dashboard
 */
import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { format, subDays } from 'date-fns';
import {
  RefreshCw,
  BarChart3,
  Package,
  ClipboardList,
  LineChart,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Command,
  Activity,
  AlertTriangle,
  Truck,
  Plus
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';

import {
  getDashboardSummary,
  getProcessFlow,
  getAlerts,
  getProductionRecords,
  getTimeline,
  getStatisticsSummary,
  getAllInventory,
  getBatchSummaries,
} from './api';

import SummaryCards from './components/SummaryCards';
import ProcessFlow from './components/ProcessFlow';
import AlertsPanel from './components/AlertsPanel';
import ProductionCharts from './components/ProductionCharts';
import ProductionTable from './components/ProductionTable';
import DateFilter from './components/DateFilter';
import InventoryOverview from './components/InventoryOverview';
import ProductionEntryForm from './components/ProductionEntryForm';
import OrderTracking from './components/OrderTracking';
import CoilManagement from './components/CoilManagement';
import ReportsPanel from './components/ReportsPanel';
import { QualityCheckForm, PackagingForm, DispatchForm } from './components/FinalStages';
import ShiftProgress from './components/ShiftProgress';
import RealTimeClock from './components/RealTimeClock';

type TabView = 'dashboard' | 'entry' | 'orders' | 'coils' | 'reports' | 'alerts' | 'final-stages';



import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import { LogOut, User as UserIcon } from 'lucide-react';

function AuthenticatedApp() {
  const { user, logout, isAdmin } = useAuth();
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Date range state
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  // Query parameters
  const queryParams = {
    start_date: startDate,
    end_date: endDate,
  };

  // Data fetching with React Query
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(
    ['summary', startDate, endDate],
    () => getDashboardSummary(queryParams),
    { refetchInterval: 60000 } // Auto-refresh every minute
  );

  const {
    data: processFlow,
    isLoading: flowLoading,
    refetch: refetchFlow,
  } = useQuery(
    ['processFlow', startDate, endDate],
    () => getProcessFlow(queryParams),
    { refetchInterval: 60000 }
  );

  const {
    data: alertsData,
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery(
    ['alerts', startDate, endDate],
    () => getAlerts(queryParams),
    { refetchInterval: 30000 }
  );

  const {
    data: records,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useQuery(
    ['records', startDate, endDate],
    () => getProductionRecords({ ...queryParams, limit: 100 }),
    { refetchInterval: 60000 }
  );

  const {
    data: timelineData,
    isLoading: timelineLoading,
    refetch: refetchTimeline,
  } = useQuery(
    ['timeline', startDate, endDate],
    () => getTimeline(queryParams),
    { refetchInterval: 60000 }
  );

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery(
    ['stats', startDate, endDate],
    () => getStatisticsSummary(queryParams),
    { refetchInterval: 60000 }
  );

  // Inventory data - refreshes every 30 seconds
  const {
    data: inventory,
    refetch: refetchInventory,
  } = useQuery(
    ['inventory'],
    () => getAllInventory(),
    { refetchInterval: 30000 }
  );

  // Orders data
  const {
    data: orders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery(
    ['orders'],
    async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    { refetchInterval: 30000 }
  );

  const {
    data: batches,
    isLoading: batchesLoading,
    refetch: refetchBatches,
  } = useQuery(
    ['batches'],
    () => getBatchSummaries(),
    { refetchInterval: 20000 }
  );



  // Manual refresh all data
  // Manual refresh all data
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchFlow(),
      refetchAlerts(),
      refetchRecords(),
      refetchTimeline(),
      refetchStats(),
      refetchInventory(),
      refetchOrders(),
      refetchBatches()
    ]);
    setTimeout(() => setIsRefreshing(false), 500); // Minimum spinner time
  };

  const navigationTabs = useMemo(
    () => {
      const tabs = [
        {
          id: 'dashboard' as TabView,
          label: 'Dashboard',
          description: 'Production health overview',
          icon: <BarChart3 size={18} />,
        },
        {
          id: 'entry' as TabView,
          label: 'Production Entry',
          description: 'Log material in seconds',
          icon: <ClipboardList size={18} />,
        },
        {
          id: 'coils' as TabView,
          label: 'Coils',
          description: 'Manage inventory',
          icon: <Activity size={18} />,
        },
        {
          id: 'orders' as TabView,
          label: 'Orders',
          description: 'Track batches & status',
          icon: <Package size={18} />,
        },
        {
          id: 'alerts' as TabView,
          label: 'Live Health',
          description: 'Active alerts & issues',
          icon: <AlertTriangle size={18} />,
        },
        {
          id: 'final-stages' as TabView,
          label: 'Final Stages',
          description: 'Quality, Package, Dispatch',
          icon: <Truck size={18} />,
        },
      ];

      // Only show Reports tab to Admins
      if (isAdmin) {
        tabs.push({
          id: 'reports' as TabView,
          label: 'Reports',
          description: 'Audit-ready summaries',
          icon: <LineChart size={18} />,
        });
      }

      return tabs;
    },
    [isAdmin]
  );

  const handleTabSelect = (tabId: TabView) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };



  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white text-gray-900 border-r border-gray-200 shadow-xl transition-all duration-300 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:static md:z-0 md:translate-x-0 md:flex 
          ${isDesktopSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="relative flex flex-col flex-grow overflow-y-auto">
          {/* Toggle Button - Top Right */}
          <div className="hidden md:flex items-center justify-end p-3 border-b border-gray-200">
            <button
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title={isDesktopSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isDesktopSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
          <button
            type="button"
            className="md:hidden absolute top-4 right-4 inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 z-50"
            aria-label="Close menu"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center py-4 transition-all duration-300">
            {/* Expanded sidebar - show full logo */}
            <div className={`transition-all duration-300 ${isDesktopSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-full px-4'}`}>
              <img
                src="/tulsi-logo.png"
                alt="Tulsi Power Industry"
                className="h-16 w-full object-contain"
              />
            </div>
            {/* Collapsed sidebar - show logo icon */}
            <div className={`transition-all duration-300 ${!isDesktopSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-full flex items-center justify-center'}`}>
              <img
                src="/tulsi-logo.png"
                alt="Tulsi"
                className="h-14 w-14 object-contain"
              />
            </div>
          </div>


          <div className="px-4 mt-3">
            <hr className="border-gray-200" />
          </div>

          <div className={`flex flex-col flex-1 mt-3 ${isDesktopSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            <div className="space-y-4 flex-1">
              <nav className="space-y-2">
                {navigationTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSelect(tab.id)}
                      className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-gray-900 hover:bg-indigo-600 hover:text-white'
                        }`}
                    >
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${isActive ? 'border-white/80 bg-white/10 text-white' : 'border-gray-200 bg-white text-gray-500'
                          } ${isDesktopSidebarCollapsed ? 'mx-auto' : 'mr-4'}`}
                      >
                        {tab.icon}
                      </span>
                      <div className={`text-left transition-all duration-200 ${isDesktopSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                        <p className="whitespace-nowrap">{tab.label}</p>
                        <p className={`text-xs whitespace-nowrap ${isActive ? 'text-indigo-100' : 'text-gray-400'}`}>{tab.description}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <hr className="border-gray-200" />
            </div>

            {/* User Profile & Logout */}
            <div className="mt-auto pb-4">
              <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 ${isDesktopSidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  <UserIcon size={20} />
                </div>
                {!isDesktopSidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name || user?.username}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                  </div>
                )}
                {!isDesktopSidebarCollapsed && (
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
              {isDesktopSidebarCollapsed && (
                <button
                  onClick={logout}
                  className="mt-2 w-full p-2 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              )}
            </div>

          </div>
        </div>


      </aside>

      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Content column */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none">
        </div>

        <header className="relative z-10 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 px-6 py-6 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="mb-3 md:hidden">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md transition-all hover:border-indigo-400"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
                Menu
              </button>
            </div>
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Production Control Center</p>
                    <h1 className="text-2xl font-bold text-slate-900">Tulsi Power Industries</h1>
                  </div>
                </div>
                <p className="text-sm text-slate-600 ml-4">Real-time monitoring • Order tracking • Quality assurance</p>
              </div>

              {/* Real-Time Clock */}
              <RealTimeClock />

              {/* Global Search Bar */}
              <div className="flex-1 max-w-md hidden md:block">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="block w-full py-2.5 pl-11 pr-12 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 transition-all text-sm shadow-sm hover:shadow-md focus:shadow-md"
                    placeholder="Search orders, coils, reports..."
                    value={globalSearchTerm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGlobalSearchTerm(val);

                      // Smart Search: Auto-switch tabs (Debounced)
                      const timeoutId = setTimeout(() => {
                        if (val.toUpperCase().startsWith('C-') && activeTab !== 'coils') {
                          setActiveTab('coils');
                        } else if ((val.toUpperCase().startsWith('PO-') || val.toUpperCase().startsWith('ORD')) && activeTab !== 'orders') {
                          setActiveTab('orders');
                        }
                      }, 300);
                      return () => clearTimeout(timeoutId);
                    }}
                  />
                  {globalSearchTerm && (
                    <div className="absolute inset-y-0 right-14 flex items-center">
                      <button
                        onClick={() => setGlobalSearchTerm('')}
                        className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {globalSearchTerm.toUpperCase().startsWith('C-') && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-24 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                      COILS
                    </div>
                  )}
                  {globalSearchTerm.toUpperCase().startsWith('PO-') && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-24 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                      ORDERS
                    </div>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-200 rounded-lg text-xs font-bold text-slate-500">
                      <Command size={10} />
                      <span>K</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className={`inline-flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl font-semibold shadow-2xl hover:-translate-y-0.5 transition-all ${isRefreshing ? 'opacity-80 cursor-wait' : ''}`}
                title="Refresh all data"
              >
                <RefreshCw size={18} className={`text-blue-200 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Syncing...' : 'Sync Data'}
              </button>
            </div>


          </div>
        </header>

        <main className="relative z-10 px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Quick Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('entry')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      <Plus size={16} />
                      New Entry
                    </button>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      <Plus size={16} />
                      New Order
                    </button>
                  </div>

                  <DateFilter
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                </div>


                {/* Shift Progress */}
                <ShiftProgress />


                <SummaryCards summary={summary} isLoading={summaryLoading} />

                <InventoryOverview inventory={inventory || []} />

                <ProcessFlow nodes={processFlow || []} isLoading={flowLoading} />

                <ProductionCharts
                  timelineData={timelineData?.timeline || []}
                  stageStats={statsData?.stages || []}
                  isLoading={timelineLoading || statsLoading}
                />
              </>
            )}

            {activeTab === 'entry' && (
              <div className="max-w-4xl mx-auto w-full">
                <ProductionEntryForm
                  onSuccess={() => {
                    refetchRecords();
                    refetchInventory();
                    refetchSummary();
                    refetchOrders();
                  }}
                  orders={orders || []}
                  batches={batches || []}
                  onRefresh={() => {
                    refetchBatches();
                    refetchRecords();
                    refetchInventory();
                    refetchSummary();
                    refetchOrders();
                  }}
                />
              </div>
            )}

            {activeTab === 'orders' && (
              <OrderTracking
                orders={orders || []}
                isLoading={ordersLoading}
                batches={batches || []}
                batchesLoading={batchesLoading}
                onRefreshBatches={refetchBatches}
                externalSearchTerm={globalSearchTerm}
              />
            )}

            {activeTab === 'coils' && (
              <CoilManagement
                batches={batches || []}
                isLoading={batchesLoading}
                onRefresh={refetchBatches}
                orders={orders || []}
                externalSearchTerm={globalSearchTerm}
              />
            )}

            {activeTab === 'alerts' && (
              <div className="max-w-4xl mx-auto">
                <AlertsPanel alerts={alertsData?.alerts || []} isLoading={alertsLoading} />
              </div>
            )}

            {activeTab === 'reports' && isAdmin && (
              <div className="space-y-8">
                <ReportsPanel />
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900">Traceability & Production Records</h3>
                  </div>
                  <ProductionTable records={records || []} isLoading={recordsLoading} />
                </div>
              </div>
            )}

            {activeTab === 'final-stages' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Final Stages</h2>
                  <p className="text-slate-600">Complete the order lifecycle with quality check, packaging, and dispatch</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <QualityCheckForm
                      batchId={1}
                      onSuccess={() => {
                        // In a real app, we would refresh data here
                        // handleRefreshAll();
                        console.log('Quality check recorded');
                      }}
                    />
                  </div>

                  <div>
                    <PackagingForm
                      batchId={1}
                      onSuccess={() => {
                        // handleRefreshAll();
                        console.log('Packaging recorded');
                      }}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <DispatchForm
                      orderId={1}
                      onSuccess={() => {
                        // handleRefreshAll();
                        console.log('Dispatch recorded');
                      }}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Select a specific batch or order from the Orders tab to use these forms with actual data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="relative bg-white/90 border-t border-slate-200 backdrop-blur-xl px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-600 gap-3">
              <p>© 2024 Tulsi Power Industries · Production Monitoring System</p>
              <p className="font-semibold text-slate-800">Process Spine: RBD → Inter → Oven → DPC → Rewind → Quality Check → Packaging → Dispatch</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

export default App;
