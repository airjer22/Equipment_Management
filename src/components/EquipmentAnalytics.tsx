import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Card } from './Card';
import { supabase } from '../lib/supabase';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export function EquipmentAnalytics() {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBorrows, setTotalBorrows] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { data: loans } = await supabase
        .from('loans')
        .select('equipment:equipment_items(category)')
        .gte('borrowed_at', startDate.toISOString());

      if (!loans) {
        setStats([]);
        setTotalBorrows(0);
        return;
      }

      const categoryCounts: Record<string, number> = {};
      let total = 0;

      loans.forEach((loan: any) => {
        const category = loan.equipment?.category;
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          total++;
        }
      });

      const categoryStats: CategoryStat[] = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      setStats(categoryStats);
      setTotalBorrows(total);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setStats([]);
      setTotalBorrows(0);
    } finally {
      setLoading(false);
    }
  }

  function getPeriodLabel() {
    switch (period) {
      case 'day':
        return 'Today';
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'year':
        return 'Last Year';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Equipment Usage Analytics</h3>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Borrows</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBorrows}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getPeriodLabel()}</p>
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(['day', 'week', 'month', 'year'] as TimePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    period === p
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {p === 'day' && 'Day'}
                  {p === 'week' && 'Week'}
                  {p === 'month' && 'Month'}
                  {p === 'year' && 'Year'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading analytics...</p>
            </div>
          ) : stats.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No borrowing activity in this period</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">Usage Insights</p>
                    <p>Track popular equipment categories to inform purchasing decisions</p>
                  </div>
                </div>
              </div>

              {stats.map((stat, index) => (
                <div key={stat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{stat.category}</span>
                      {index === 0 && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-300">{stat.count} borrows</span>
                      <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[3rem] text-right">
                        {stat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0
                          ? 'bg-green-500'
                          : index === 1
                          ? 'bg-blue-500'
                          : index === 2
                          ? 'bg-purple-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
