import { useEffect, useState } from 'react';
import { Plus, Minus, ChevronRight, Edit2, Trash2, X, Check } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { supabase } from '../../lib/supabase';

interface Settings {
  id: string;
  school_name: string;
  academic_year: string;
  overdue_alerts_enabled: boolean;
  low_stock_warnings_enabled: boolean;
  email_digest_frequency: 'daily' | 'weekly';
  borrow_history_retention_months: number;
  require_student_id: boolean;
  app_version: string;
}

interface Category {
  name: string;
  count: number;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateSettings(updates: Partial<Settings>) {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates } as Settings);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  }

  function incrementRetention() {
    if (settings) {
      updateSettings({
        borrow_history_retention_months: settings.borrow_history_retention_months + 1,
      });
    }
  }

  function decrementRetention() {
    if (settings && settings.borrow_history_retention_months > 1) {
      updateSettings({
        borrow_history_retention_months: settings.borrow_history_retention_months - 1,
      });
    }
  }

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('category');

      if (error) throw error;

      const categoryCounts = data.reduce((acc: Record<string, number>, item) => {
        const cat = item.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const categoryList: Category[] = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;

    try {
      const categoryExists = categories.some(
        cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
      );

      if (categoryExists) {
        alert('Category already exists');
        return;
      }

      setCategories([...categories, { name: newCategory.trim(), count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory('');
      setShowAddCategory(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  }

  async function handleRenameCategory(oldName: string, newName: string) {
    if (!newName.trim() || oldName === newName) {
      setEditingCategory(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('equipment_items')
        .update({ category: newName.trim() })
        .eq('category', oldName);

      if (error) throw error;

      await loadCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error renaming category:', error);
      alert('Failed to rename category');
    }
  }

  async function handleDeleteCategory(categoryName: string) {
    const category = categories.find(c => c.name === categoryName);

    if (!category) return;

    if (category.count > 0) {
      alert(`Cannot delete "${categoryName}" because it has ${category.count} item(s). Please reassign or delete those items first.`);
      return;
    }

    setCategories(categories.filter(c => c.name !== categoryName));
    setDeletingCategory(null);
  }

  function startEdit(category: string) {
    setEditingCategory(category);
    setEditValue(category);
  }

  function cancelEdit() {
    setEditingCategory(null);
    setEditValue('');
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-400">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-400">Settings not found</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        {saving && <span className="text-sm text-blue-600 dark:text-blue-400">Saving...</span>}
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              School Name
            </label>
            <input
              type="text"
              value={settings.school_name}
              onChange={(e) => updateSettings({ school_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Academic Year
            </label>
            <select
              value={settings.academic_year}
              onChange={(e) => updateSettings({ academic_year: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Equipment Categories</h3>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {loadingCategories ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No categories found</div>
        ) : (
          <div className="space-y-2">
            {categories.map(category => (
              <div
                key={category.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {editingCategory === category.name ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCategory(category.name, editValue);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameCategory(category.name, editValue)}
                      className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({category.count} item{category.count !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(category.name)}
                        className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Rename category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCategory(category.name)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete category"
                        disabled={category.count > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={showAddCategory}
          onClose={() => {
            setShowAddCategory(false);
            setNewCategory('');
          }}
          size="sm"
          position="center"
        >
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Category</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="e.g., Basketball, Tennis, Soccer"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                fullWidth
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
              >
                Add Category
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          size="sm"
          position="center"
        >
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Category</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete the category "{deletingCategory}"?
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                fullWidth
                onClick={() => deletingCategory && handleDeleteCategory(deletingCategory)}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setDeletingCategory(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Overdue Alerts</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about overdue items</p>
            </div>
            <button
              onClick={() =>
                updateSettings({ overdue_alerts_enabled: !settings.overdue_alerts_enabled })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.overdue_alerts_enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.overdue_alerts_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Low Stock Warnings</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Alert when equipment runs low</p>
            </div>
            <button
              onClick={() =>
                updateSettings({
                  low_stock_warnings_enabled: !settings.low_stock_warnings_enabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.low_stock_warnings_enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.low_stock_warnings_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Digest Frequency
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ email_digest_frequency: 'daily' })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.email_digest_frequency === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => updateSettings({ email_digest_frequency: 'weekly' })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.email_digest_frequency === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data and Privacy</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Borrow History Retention
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementRetention}
                disabled={settings.borrow_history_retention_months <= 1}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Minus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {settings.borrow_history_retention_months}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">months</p>
              </div>
              <button
                onClick={incrementRetention}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Require Student ID</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Students must show ID when borrowing</p>
            </div>
            <button
              onClick={() =>
                updateSettings({ require_student_id: !settings.require_student_id })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.require_student_id ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.require_student_id ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Roles</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <span className="font-medium text-gray-900 dark:text-white">Sports Captain Permissions</span>
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <span className="font-medium text-gray-900 dark:text-white">Staff Permissions</span>
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">App Version</span>
            <span className="font-medium text-gray-900 dark:text-white">{settings.app_version}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Build</span>
            <span className="font-medium text-gray-900 dark:text-white">20241214</span>
          </div>
          <Button variant="danger" fullWidth>
            Clear Cache and Data
          </Button>
        </div>
      </Card>
    </div>
  );
}
