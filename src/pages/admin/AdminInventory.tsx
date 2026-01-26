import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { SearchBar } from '../../components/SearchBar';
import { FilterPills } from '../../components/FilterPills';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { supabase } from '../../lib/supabase';
import { Toast } from '../../components/Toast';

interface EquipmentItem {
  id: string;
  item_id: string;
  name: string;
  category: string;
  image_url: string | null;
  location: string | null;
  status: 'available' | 'borrowed' | 'reserved' | 'repair';
  condition_notes: string | null;
}

export function AdminInventory() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<EquipmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    item_id: '',
    name: '',
    category: 'Basketball',
    status: 'available' as const,
    condition_notes: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, statusFilter]);

  async function loadItems() {
    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterItems() {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.item_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      const statusValue = statusFilter === 'Lost or Damaged' ? 'repair' : statusFilter.toLowerCase();
      filtered = filtered.filter((item) => item.status === statusValue);
    }

    setFilteredItems(filtered);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image must be less than 5MB', type: 'error' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setSelectedFile(null);
    setImagePreview(null);
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `equipment/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = editingItem?.image_url || null;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      if (editingItem) {
        const { error } = await supabase
          .from('equipment_items')
          .update({
            ...formData,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        setToast({ message: 'Equipment updated successfully', type: 'success' });
      } else {
        if (!imageUrl) {
          setToast({ message: 'Please upload an image', type: 'error' });
          setUploading(false);
          return;
        }

        const { error } = await supabase
          .from('equipment_items')
          .insert({
            ...formData,
            image_url: imageUrl,
          });

        if (error) throw error;
        setToast({ message: 'Equipment added successfully', type: 'success' });
      }

      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
      loadItems();
    } catch (error: any) {
      console.error('Error saving item:', error);
      setToast({ message: error.message || 'Failed to save equipment', type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('equipment_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  function resetForm() {
    setFormData({
      item_id: '',
      name: '',
      category: 'Basketball',
      status: 'available',
      condition_notes: '',
    });
    clearImage();
  }

  function openEditModal(item: EquipmentItem) {
    setEditingItem(item);
    setFormData({
      item_id: item.item_id,
      name: item.name,
      category: item.category,
      status: item.status,
      condition_notes: item.condition_notes || '',
    });
    setImagePreview(item.image_url);
    setShowAddModal(true);
  }

  const statusOptions = ['All', 'Available', 'Borrowed', 'Reserved', 'Lost or Damaged'];

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by name or ID..."
      />

      <FilterPills
        options={statusOptions}
        selected={statusFilter}
        onChange={setStatusFilter}
      />

      <div className="grid grid-cols-4 gap-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute top-1.5 left-1.5">
                <StatusBadge
                  status={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  variant={item.status as any}
                  size="sm"
                />
              </div>
            </div>
            <div className="p-2 space-y-1.5">
              <div>
                <h3 className="font-semibold text-gray-900 text-xs truncate">{item.name}</h3>
                <p className="text-xs text-gray-500 truncate">ID: {item.item_id}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => openEditModal(item)}
                  className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-xs font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-xs font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          resetForm();
          setEditingItem(null);
          setShowAddModal(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
          resetForm();
        }}
        title={editingItem ? 'Edit Equipment' : 'Add New Equipment'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Image *
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Upload className="w-12 h-12 mb-2" />
                  <p className="font-medium">Click to upload image</p>
                  <p className="text-sm">PNG, JPG up to 5MB</p>
                </div>
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment ID *
            </label>
            <input
              type="text"
              required
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              placeholder="e.g., BB-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Basketball #1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Basketball">Basketball</option>
              <option value="Football">Football</option>
              <option value="Soccer">Soccer</option>
              <option value="Tennis">Tennis</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="available">Available</option>
              <option value="borrowed">Borrowed</option>
              <option value="reserved">Reserved</option>
              <option value="repair">Lost or Damaged</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition Notes
            </label>
            <textarea
              value={formData.condition_notes}
              onChange={(e) => setFormData({ ...formData, condition_notes: e.target.value })}
              placeholder="Any notes about the item's condition..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowAddModal(false);
                setEditingItem(null);
                resetForm();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth disabled={uploading}>
              {uploading ? 'Saving...' : editingItem ? 'Update Equipment' : 'Add Equipment'}
            </Button>
          </div>
        </form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
