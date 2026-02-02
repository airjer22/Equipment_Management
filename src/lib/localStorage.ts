export interface Student {
  id: string;
  name: string;
  class: string;
  house?: string;
  trust_score: number;
  total_loans: number;
  active_loans: number;
  late_returns: number;
  is_blacklisted: boolean;
  warning_level: number;
  created_at: string;
}

const STUDENTS_KEY = 'icss_students';

export const studentStorage = {
  getAll(): Student[] {
    const data = localStorage.getItem(STUDENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getById(id: string): Student | null {
    const students = this.getAll();
    return students.find(s => s.id === id) || null;
  },

  search(query: string): Student[] {
    const students = this.getAll();
    const lowerQuery = query.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.class.toLowerCase().includes(lowerQuery) ||
      (s.house && s.house.toLowerCase().includes(lowerQuery))
    );
  },

  save(students: Student[]): void {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  },

  add(student: Omit<Student, 'id' | 'created_at'>): Student {
    const students = this.getAll();
    const newStudent: Student = {
      ...student,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    students.push(newStudent);
    this.save(students);
    return newStudent;
  },

  update(id: string, updates: Partial<Student>): Student | null {
    const students = this.getAll();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;

    students[index] = { ...students[index], ...updates };
    this.save(students);
    return students[index];
  },

  delete(id: string): boolean {
    const students = this.getAll();
    const filtered = students.filter(s => s.id !== id);
    if (filtered.length === students.length) return false;

    this.save(filtered);
    return true;
  },

  clear(): void {
    localStorage.removeItem(STUDENTS_KEY);
  },

  import(students: Omit<Student, 'id' | 'created_at'>[]): void {
    const newStudents: Student[] = students.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));
    this.save(newStudents);
  },

  incrementLoan(id: string): void {
    const student = this.getById(id);
    if (!student) return;

    this.update(id, {
      total_loans: student.total_loans + 1,
      active_loans: student.active_loans + 1,
    });
  },

  decrementActiveLoan(id: string): void {
    const student = this.getById(id);
    if (!student) return;

    this.update(id, {
      active_loans: Math.max(0, student.active_loans - 1),
    });
  },

  recordLateReturn(id: string): void {
    const student = this.getById(id);
    if (!student) return;

    const newLateReturns = student.late_returns + 1;
    let warningLevel = student.warning_level;
    let isBlacklisted = student.is_blacklisted;

    if (newLateReturns >= 1 && warningLevel === 0) {
      warningLevel = 1;
    } else if (newLateReturns >= 2 && warningLevel === 1) {
      warningLevel = 2;
    } else if (newLateReturns >= 3 && warningLevel === 2) {
      warningLevel = 3;
      isBlacklisted = true;
    }

    const trustScore = Math.max(0, 100 - (newLateReturns * 20));

    this.update(id, {
      late_returns: newLateReturns,
      warning_level: warningLevel,
      is_blacklisted: isBlacklisted,
      trust_score: trustScore,
    });
  },
};
