import { useEffect, useState } from 'react';
import { SearchBar } from '../../components/SearchBar';
import { Avatar } from '../../components/Avatar';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { StudentProfileModal } from '../../components/StudentProfileModal';
import { supabase } from '../../lib/supabase';
import { Calendar, Plus, Upload, FileText, FileSpreadsheet, Trash2, User, CheckSquare, Square } from 'lucide-react';
import { Toast } from '../../components/Toast';
import * as XLSX from 'xlsx';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  year_group: string;
  class_name: string | null;
  house: string | null;
  avatar_url: string | null;
  trust_score: number;
  is_blacklisted: boolean;
  blacklist_end_date: string | null;
  blacklist_reason: string | null;
}

export function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overdueStudents, setOverdueStudents] = useState<Set<string>>(new Set());
  const [addMode, setAddMode] = useState<'manual' | 'csv' | 'excel'>('manual');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [importing, setImporting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [manualForm, setManualForm] = useState({
    full_name: '',
    class_name: '',
  });

  const [blacklistForm, setBlacklistForm] = useState({
    is_blacklisted: false,
    blacklist_end_date: '',
    blacklist_reason: '',
  });

  useEffect(() => {
    loadStudents();
    loadOverdueInfo();
  }, []);

  useEffect(() => {
    filterStudents();
    setSelectedStudents(new Set());
  }, [students, searchQuery]);

  async function loadStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOverdueInfo() {
    try {
      const { data } = await supabase
        .from('loans')
        .select('student_id')
        .is('returned_at', null)
        .lt('due_at', new Date().toISOString());

      if (data) {
        setOverdueStudents(new Set(data.map(loan => loan.student_id)));
      }
    } catch (error) {
      console.error('Error loading overdue info:', error);
    }
  }

  function filterStudents() {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.class_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }

  function openBlacklistModal(student: Student) {
    setSelectedStudent(student);
    setBlacklistForm({
      is_blacklisted: student.is_blacklisted,
      blacklist_end_date: student.blacklist_end_date?.split('T')[0] || '',
      blacklist_reason: student.blacklist_reason || '',
    });
    setShowBlacklistModal(true);
  }

  function handleViewProfile(student: Student) {
    setProfileStudent(student);
    setShowProfileModal(true);
  }

  function toggleStudentSelection(studentId: string) {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  }

  function toggleSelectAll() {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  }

  async function handleBulkDelete() {
    if (selectedStudents.size === 0) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .in('id', Array.from(selectedStudents));

      if (error) throw error;

      setToast({
        message: `Successfully deleted ${selectedStudents.size} student${selectedStudents.size > 1 ? 's' : ''}`,
        type: 'success'
      });
      setSelectedStudents(new Set());
      setShowBulkDeleteConfirm(false);
      loadStudents();
    } catch (error: any) {
      console.error('Error deleting students:', error);
      setToast({ message: error.message || 'Failed to delete students', type: 'error' });
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);

    try {
      const studentId = `STU${Date.now().toString().slice(-6)}`;

      const { error } = await supabase
        .from('students')
        .insert({
          student_id: studentId,
          full_name: manualForm.full_name,
          class_name: manualForm.class_name,
          year_group: 'Year 7',
          trust_score: 100,
          is_blacklisted: false,
        });

      if (error) throw error;

      setToast({ message: 'Student added successfully', type: 'success' });
      setShowAddModal(false);
      setManualForm({ full_name: '', class_name: '' });
      loadStudents();
    } catch (error: any) {
      console.error('Error adding student:', error);
      setToast({ message: error.message || 'Failed to add student', type: 'error' });
    } finally {
      setImporting(false);
    }
  }

  function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'excel') {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      let data: any[];

      if (type === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          throw new Error('CSV file must have headers and at least one data row');
        }

        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h.includes('name'));
        const classIndex = headers.findIndex(h => h.includes('class'));
        const houseIndex = headers.findIndex(h => h.includes('house'));

        if (nameIndex === -1 || classIndex === -1) {
          throw new Error('CSV must have "name" and "class" columns');
        }

        data = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          return {
            full_name: values[nameIndex],
            class_name: values[classIndex],
            house: houseIndex !== -1 ? values[houseIndex] : null,
          };
        }).filter(row => row.full_name && row.class_name);

      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        data = jsonData.map((row: any) => {
          const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name'));
          const classKey = Object.keys(row).find(k => k.toLowerCase().includes('class'));
          const houseKey = Object.keys(row).find(k => k.toLowerCase().includes('house'));

          if (!nameKey || !classKey) {
            throw new Error('Excel must have "name" and "class" columns');
          }

          return {
            full_name: String(row[nameKey]).trim(),
            class_name: String(row[classKey]).trim(),
            house: houseKey ? String(row[houseKey]).trim() : null,
          };
        }).filter(row => row.full_name && row.class_name);
      }

      if (data.length === 0) {
        throw new Error('No valid data found in file');
      }

      const studentsToInsert = data.map((row, index) => ({
        student_id: `STU${Date.now().toString().slice(-6)}${index}`,
        full_name: row.full_name,
        class_name: row.class_name,
        year_group: row.class_name,
        house: row.house,
        trust_score: 100,
        is_blacklisted: false,
      }));

      const { error } = await supabase
        .from('students')
        .insert(studentsToInsert);

      if (error) throw error;

      setToast({ message: `Successfully imported ${data.length} students`, type: 'success' });
      setShowAddModal(false);
      loadStudents();
    } catch (error: any) {
      console.error('Error importing file:', error);
      setToast({ message: error.message || 'Failed to import file', type: 'error' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  async function handleDeleteStudent(studentId: string) {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setToast({ message: 'Student deleted successfully', type: 'success' });
      loadStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      setToast({ message: error.message || 'Failed to delete student', type: 'error' });
    }
  }

  async function handleBlacklistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const updateData: any = {
        is_blacklisted: blacklistForm.is_blacklisted,
        blacklist_end_date: blacklistForm.is_blacklisted ? new Date(blacklistForm.blacklist_end_date).toISOString() : null,
        blacklist_reason: blacklistForm.is_blacklisted ? blacklistForm.blacklist_reason : null,
        updated_at: new Date().toISOString(),
      };

      if (blacklistForm.is_blacklisted && !selectedStudent.is_blacklisted) {
        updateData.trust_score = Math.max(0, selectedStudent.trust_score * 0.5);
      }

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', selectedStudent.id);

      if (error) throw error;

      if (blacklistForm.is_blacklisted) {
        await supabase.from('blacklist_entries').insert({
          student_id: selectedStudent.id,
          end_date: new Date(blacklistForm.blacklist_end_date).toISOString(),
          reason: blacklistForm.blacklist_reason,
          is_active: true,
        });
      }

      setShowBlacklistModal(false);
      setToast({ message: 'Student access updated', type: 'success' });
      loadStudents();
    } catch (error: any) {
      console.error('Error updating blacklist:', error);
      setToast({ message: error.message || 'Failed to update student', type: 'error' });
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading students...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Student Database</h2>
        <span className="text-sm text-gray-600">{students.length} students</span>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search name or class..."
      />

      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">No students found. Add students to get started.</p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Students
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Students ({filteredStudents.length})
            </h3>
            <div className="flex items-center gap-3">
              {selectedStudents.size > 0 && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedStudents.size} Selected
                </Button>
              )}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {selectedStudents.size === filteredStudents.length ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Select All
              </button>
            </div>
          </div>
          {filteredStudents.map((student) => {
          const isOverdue = overdueStudents.has(student.id);

          const isSelected = selectedStudents.has(student.id);

          return (
            <div
              key={student.id}
              className={`bg-white rounded-lg shadow-md p-4 ${
                isOverdue ? 'border-2 border-red-300' : ''
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleStudentSelection(student.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Square className="w-6 h-6" />
                  )}
                </button>
                <Avatar
                  src={student.avatar_url}
                  name={student.full_name}
                  size="md"
                  showStatus={!isOverdue}
                  statusColor={student.is_blacklisted ? 'red' : 'green'}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                  <p className="text-sm text-gray-600">
                    {student.class_name || student.year_group}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isOverdue ? (
                    <StatusBadge status="OVERDUE" variant="overdue" size="sm" />
                  ) : (
                    <button
                      onClick={() => handleViewProfile(student)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                  )}
                  <Button
                    size="sm"
                    variant={isOverdue ? 'danger' : 'secondary'}
                    onClick={() => openBlacklistModal(student)}
                  >
                    {isOverdue ? 'View' : 'Manage'}
                  </Button>
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Students"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setAddMode('manual')}
              className={`px-4 py-2 font-medium transition-colors ${
                addMode === 'manual'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setAddMode('csv')}
              className={`px-4 py-2 font-medium transition-colors ${
                addMode === 'csv'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              CSV Import
            </button>
            <button
              onClick={() => setAddMode('excel')}
              className={`px-4 py-2 font-medium transition-colors ${
                addMode === 'excel'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Excel Import
            </button>
          </div>

          {addMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.full_name}
                  onChange={(e) => setManualForm({ ...manualForm, full_name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.class_name}
                  onChange={(e) => setManualForm({ ...manualForm, class_name: e.target.value })}
                  placeholder="e.g., 7A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowAddModal(false)}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button type="submit" fullWidth disabled={importing}>
                  {importing ? 'Adding...' : 'Add Student'}
                </Button>
              </div>
            </form>
          )}

          {addMode === 'csv' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">CSV Format Requirements:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• First row must contain headers</li>
                  <li>• Must include columns: "name" and "class"</li>
                  <li>• Example: name,class</li>
                  <li>• Example: John Smith,7A</li>
                </ul>
              </div>

              <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileImport(e, 'csv')}
                  className="hidden"
                  disabled={importing}
                />
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <FileText className="w-12 h-12 mb-2" />
                  <p className="font-medium">{importing ? 'Importing...' : 'Click to upload CSV'}</p>
                  <p className="text-sm">Upload your student list</p>
                </div>
              </label>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowAddModal(false)}
                disabled={importing}
              >
                Cancel
              </Button>
            </div>
          )}

          {addMode === 'excel' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-900 font-medium mb-2">Excel Format Requirements:</p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• First row must contain headers</li>
                  <li>• Must include columns: "name" and "class"</li>
                  <li>• Supports .xlsx and .xls formats</li>
                  <li>• Only the first sheet will be imported</li>
                </ul>
              </div>

              <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileImport(e, 'excel')}
                  className="hidden"
                  disabled={importing}
                />
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <FileSpreadsheet className="w-12 h-12 mb-2" />
                  <p className="font-medium">{importing ? 'Importing...' : 'Click to upload Excel'}</p>
                  <p className="text-sm">Upload your student list</p>
                </div>
              </label>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowAddModal(false)}
                disabled={importing}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showBlacklistModal}
        onClose={() => setShowBlacklistModal(false)}
        title="Manage Student Access"
        size="md"
        position="bottom"
      >
        {selectedStudent && (
          <form onSubmit={handleBlacklistSubmit} className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <Avatar
                src={selectedStudent.avatar_url}
                name={selectedStudent.full_name}
                size="lg"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{selectedStudent.full_name}</h3>
                <p className="text-sm text-gray-600">{selectedStudent.class_name}</p>
                <p className="text-xs text-gray-500">ID: {selectedStudent.student_id}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Blacklisted</span>
                <button
                  type="button"
                  onClick={() =>
                    setBlacklistForm({
                      ...blacklistForm,
                      is_blacklisted: !blacklistForm.is_blacklisted,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    blacklistForm.is_blacklisted ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      blacklistForm.is_blacklisted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {blacklistForm.is_blacklisted && (
                <p className="text-sm text-red-700">
                  Student will not be able to borrow equipment
                </p>
              )}
            </div>

            {blacklistForm.is_blacklisted && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Blacklist End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={blacklistForm.blacklist_end_date}
                    onChange={(e) =>
                      setBlacklistForm({
                        ...blacklistForm,
                        blacklist_end_date: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason / Note *
                  </label>
                  <textarea
                    required
                    value={blacklistForm.blacklist_reason}
                    onChange={(e) =>
                      setBlacklistForm({
                        ...blacklistForm,
                        blacklist_reason: e.target.value,
                      })
                    }
                    placeholder="Why is this student being blacklisted?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setShowBlacklistModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <StudentProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        student={profileStudent}
      />

      <Modal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Confirm Bulk Deletion"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-900 font-medium">
              You are about to delete {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''}.
            </p>
            <p className="text-red-800 text-sm mt-2">
              This action cannot be undone. All associated data will be permanently removed.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowBulkDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleBulkDelete}
            >
              Delete {selectedStudents.size} Student{selectedStudents.size > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
