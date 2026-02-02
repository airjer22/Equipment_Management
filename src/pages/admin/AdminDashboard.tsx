import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Clock, ArrowRight, X, CreditCard as Edit2, Check } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { EquipmentAnalytics } from '../../components/EquipmentAnalytics';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/Avatar';
import { supabase } from '../../lib/supabase';
import { studentStorage } from '../../lib/localStorage';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  availableItems: number;
  currentlyOut: number;
  overdueLoans: any[];
  activeLoans: any[];
}

export function AdminDashboard() {
  const { profile, user, refreshProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    availableItems: 0,
    currentlyOut: 0,
    overdueLoans: [],
    activeLoans: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAllLoans, setShowAllLoans] = useState(false);
  const [allActiveLoans, setAllActiveLoans] = useState<any[]>([]);
  const [showAvailableItems, setShowAvailableItems] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    loadDashboardData();

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDashboardData() {
    try {
      const [equipmentRes, loansRes] = await Promise.all([
        supabase.from('equipment_items').select('status'),
        supabase
          .from('loans')
          .select('*, equipment:equipment_items(*)')
          .is('returned_at', null)
          .order('due_at', { ascending: true }),
      ]);

      if (equipmentRes.data) {
        const available = equipmentRes.data.filter(item => item.status === 'available').length;
        const borrowed = equipmentRes.data.filter(item => item.status === 'borrowed').length;

        setStats(prev => ({
          ...prev,
          availableItems: available,
          currentlyOut: borrowed,
        }));
      }

      if (loansRes.data) {
        const now = new Date();
        const loansWithStudents = loansRes.data.map(loan => {
          const student = studentStorage.getById(loan.student_id);
          return {
            ...loan,
            student_name: student?.name || 'Unknown Student',
          };
        });

        const overdue = loansWithStudents.filter(loan => new Date(loan.due_at) < now);
        const active = loansWithStudents.filter(loan => new Date(loan.due_at) >= now);

        setStats(prev => ({
          ...prev,
          overdueLoans: overdue,
          activeLoans: active.slice(0, 5),
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllActiveLoans() {
    try {
      const { data: loans } = await supabase
        .from('loans')
        .select('*, equipment:equipment_items(*)')
        .is('returned_at', null)
        .order('borrowed_at', { ascending: false });

      if (loans) {
        const loansWithStudents = loans.map(loan => {
          const student = studentStorage.getById(loan.student_id);
          return {
            ...loan,
            student_name: student?.name || 'Unknown Student',
          };
        });
        setAllActiveLoans(loansWithStudents);
      }
    } catch (error) {
      console.error('Error loading all active loans:', error);
    }
  }

  async function loadAvailableEquipment() {
    try {
      const { data: equipment } = await supabase
        .from('equipment_items')
        .select('*')
        .eq('status', 'available')
        .order('name', { ascending: true });

      if (equipment) {
        setAvailableEquipment(equipment);
      }
    } catch (error) {
      console.error('Error loading available equipment:', error);
    }
  }

  async function handleReturn(loanId: string, equipmentId: string) {
    try {
      await supabase
        .from('loans')
        .update({ returned_at: new Date().toISOString(), status: 'returned' })
        .eq('id', loanId);

      await supabase
        .from('equipment_items')
        .update({ status: 'available' })
        .eq('id', equipmentId);

      loadDashboardData();
      if (showAllLoans) {
        loadAllActiveLoans();
      }
    } catch (error) {
      console.error('Error returning item:', error);
    }
  }

  function handleShowAllLoans() {
    loadAllActiveLoans();
    setShowAllLoans(true);
  }

  function handleShowAvailableItems() {
    loadAvailableEquipment();
    setShowAvailableItems(true);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function handleEditName() {
    setEditedName(profile?.full_name || '');
    setIsEditingName(true);
  }

  async function handleSaveName() {
    if (!user?.id || !editedName.trim()) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: editedName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  }

  function getTimeAgo(date: string) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  }

  function getOverdueDuration(dueDate: string) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = now.getTime() - due.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Just overdue';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 group">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{getGreeting()},</h2>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-500 focus:outline-none bg-transparent px-2"
                placeholder="Your name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                title="Save name"
              >
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getGreeting()}, {profile?.full_name || 'Admin'}
              </h2>
              <button
                onClick={handleEditName}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                title="Edit name"
              >
                <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Here's what's happening with your equipment today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={handleShowAvailableItems} className="w-full text-left">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-gray-300 font-medium">Available Items</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-white">{stats.availableItems}</p>
              </div>
            </div>
          </Card>
        </button>

        <button onClick={handleShowAllLoans} className="w-full text-left">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700 dark:text-gray-300 font-medium">Currently Out</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-white">{stats.currentlyOut}</p>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {stats.overdueLoans.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Action Required</h3>
          <div className="space-y-3">
            {stats.overdueLoans.map((loan) => (
              <Card key={loan.id} borderLeft="border-red-500">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{loan.equipment?.name}</p>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Overdue by {getOverdueDuration(loan.due_at)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Borrowed by {loan.student_name || 'Unknown Student'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReturn(loan.id, loan.equipment_id)}
                      >
                        Return
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Loans</h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {stats.activeLoans.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No active loans at the moment</p>
            </Card>
          ) : (
            stats.activeLoans.map((loan) => (
              <Card key={loan.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{loan.equipment?.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {loan.student_name || 'Unknown Student'} • {getTimeAgo(loan.borrowed_at)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="Active" variant="active" size="sm" />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <EquipmentAnalytics />

      <Modal
        isOpen={showAllLoans}
        onClose={() => setShowAllLoans(false)}
        size="lg"
        title="All Borrowed Items"
      >
        <div className="space-y-3">
          {allActiveLoans.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No active loans at the moment</p>
            </div>
          ) : (
            allActiveLoans.map((loan) => {
              const isOverdue = new Date(loan.due_at) < new Date();
              return (
                <Card key={loan.id} className={isOverdue ? 'border-red-300 dark:border-red-700' : ''}>
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={loan.student_name || 'Unknown'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">{loan.equipment?.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                            {loan.equipment?.category} • {loan.equipment?.item_id}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">{loan.student_name || 'Unknown Student'}</span>
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Borrowed {getTimeAgo(loan.borrowed_at)}
                            {isOverdue && (
                              <span className="text-red-600 dark:text-red-400 font-semibold ml-2">
                                • Overdue by {getOverdueDuration(loan.due_at)}
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isOverdue ? 'danger' : 'primary'}
                          onClick={() => handleReturn(loan.id, loan.equipment_id)}
                        >
                          Return
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAvailableItems}
        onClose={() => setShowAvailableItems(false)}
        size="lg"
        title="Available Equipment"
      >
        <div className="space-y-3">
          {availableEquipment.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No available equipment at the moment</p>
            </div>
          ) : (
            availableEquipment.map((equipment) => (
              <Card key={equipment.id}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{equipment.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {equipment.category} • {equipment.item_id}
                    </p>
                    {equipment.condition && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Condition: {equipment.condition}
                      </p>
                    )}
                  </div>
                  <StatusBadge status="Available" variant="success" size="sm" />
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
