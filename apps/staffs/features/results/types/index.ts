export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Student {
  id: string;
  matricNumber: string;
  user: User;
}

export interface Enrollment {
  id: string;
  student: Student;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  department: Department;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  faculty: Faculty;
  stats?: {
    studentCount: number;
    staffCount: number;
    courseCount: number;
  };
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
  departments: Department[];
  stats?: {
    studentCount: number;
    staffCount: number;
    courseCount: number;
    departmentCount: number;
  };
}

export interface Staff {
  id: string;
  user: User;
}

export interface Approval {
  id: string;
  hodStatus: string;
  hodRemarks?: string;
  hodApprovedBy?: User;
  deanStatus: string;
  deanRemarks?: string;
  deanApprovedBy?: User;
  senateStatus: string;
  senateRemarks?: string;
  senateApprovedBy?: User;
}

export interface Result {
  id: string;
  studentId: string;
  courseId: string;
  ca: number;
  exam: number;
  score: number;
  grade: string;
  gradePoint: number;
  status: string;
  semester: string;
  session: string;
  student: Student;
  course: Course;
  uploadedBy?: Staff;
  approval?: Approval;
  createdAt: string;
  updatedAt: string;
}

export interface ResultAudit {
  id: string;
  resultId: string;
  action: string;
  reason?: string;
  actorId?: string;
  actorRole?: string;
  metadata?: any;
  createdAt: string;
  result?: Result;
}

export interface UploadResultInput {
  courseId: string;
  semester: string;
  session: string;
  results: {
    studentId: string;
    ca: number;
    exam: number;
  }[];
}

export interface EditRequest {
  id: string;
  resultId: string;
  reason: string;
  status: string;
  createdAt: string;
  result: Result;
}
