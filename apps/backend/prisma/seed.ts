import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ResultStatus,
  ApprovalStatus,
  Semester,
  EnrollmentStatus,
} from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding Database ---');

  // 1. Create Faculties
  const engineering = await prisma.faculty.upsert({
    where: { code: 'ENG' },
    update: {},
    create: {
      name: 'Faculty of Engineering',
      code: 'ENG',
      description: 'Engineering and Technology',
    },
  });

  const sciences = await prisma.faculty.upsert({
    where: { code: 'SCI' },
    update: {},
    create: {
      name: 'Faculty of Sciences',
      code: 'SCI',
      description: 'Physical and Natural Sciences',
    },
  });

  console.log('Faculties created');

  // 2. Create Departments
  const computerScience = await prisma.department.upsert({
    where: { code: 'CSC' },
    update: {},
    create: {
      name: 'Computer Science',
      code: 'CSC',
      facultyId: engineering.id,
      numberOfYears: 4,
    },
  });

  const mechanicalEng = await prisma.department.upsert({
    where: { code: 'MEE' },
    update: {},
    create: {
      name: 'Mechanical Engineering',
      code: 'MEE',
      facultyId: engineering.id,
      numberOfYears: 5,
    },
  });

  const physics = await prisma.department.upsert({
    where: { code: 'PHY' },
    update: {},
    create: {
      name: 'Physics',
      code: 'PHY',
      facultyId: sciences.id,
      numberOfYears: 4,
    },
  });

  console.log('Departments created');

  // 3. Create Grade Configurations for Departments
  const gradeConfigs = [
    { grade: 'A', minScore: 70, maxScore: 100, gradePoint: 5.0 },
    { grade: 'B', minScore: 60, maxScore: 69.9, gradePoint: 4.0 },
    { grade: 'C', minScore: 50, maxScore: 59.9, gradePoint: 3.0 },
    { grade: 'D', minScore: 45, maxScore: 49.9, gradePoint: 2.0 },
    { grade: 'E', minScore: 40, maxScore: 44.9, gradePoint: 1.0 },
    { grade: 'F', minScore: 0, maxScore: 39.9, gradePoint: 0.0 },
  ];

  for (const dept of [computerScience, mechanicalEng, physics]) {
    for (const config of gradeConfigs) {
      await prisma.gradeScale.upsert({
        where: {
          departmentId_grade: {
            departmentId: dept.id,
            grade: config.grade,
          },
        },
        update: {},
        create: {
          ...config,
          departmentId: dept.id,
        },
      });
    }
  }

  console.log('Grade scales created');

  // 4. Create Users (Lecturers, HODs, Deans, Senate, Admin)
  const staffData = [
    {
      id: 'admin-1',
      email: 'collinschristroa@gmail.com',
      name: 'System Admin',
      role: 'admin',
      staffNumber: 'ADM001',
    },
    {
      id: 'senate-1',
      email: 'senate@sumas.edu',
      name: 'Senate Chair',
      role: 'SENATE',
      staffNumber: 'SEN001',
    },
    {
      id: 'dean-eng',
      email: 'dean.eng@sumas.edu',
      name: 'Dean Engineering',
      role: 'DEAN',
      staffNumber: 'D-ENG001',
      facultyId: engineering.id,
    },
    {
      id: 'hod-csc',
      email: '0xdevcollins@gmail.com',
      name: 'HOD Computer Science',
      role: 'HOD',
      staffNumber: 'H-CSC001',
      departmentId: computerScience.id,
    },
    {
      id: 'lecturer-1',
      email: 'ezugwueucharia2016@gmail.com',
      name: 'Dr. John Doe',
      role: 'LECTURER',
      staffNumber: 'L001',
      departmentId: computerScience.id,
    },
    {
      id: 'lecturer-2',
      email: 'lecturer2@sumas.edu',
      name: 'Prof. Jane Smith',
      role: 'LECTURER',
      staffNumber: 'L002',
      departmentId: computerScience.id,
    },
  ];

  const staffProfiles: any[] = [];

  for (const s of staffData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        id: s.id,
        email: s.email,
        name: s.name,
        role: s.role,
        facultyId: 'facultyId' in s ? (s as any).facultyId : undefined,
        departmentId: 'departmentId' in s ? (s as any).departmentId : undefined,
      },
    });

    const staff = await prisma.staff.upsert({
      where: { staffNumber: s.staffNumber },
      update: {},
      create: {
        userId: user.id,
        staffNumber: s.staffNumber,
        institutionalRank: s.role === 'LECTURER' ? 'Senior Lecturer' : s.role,
        designation: s.role,
        dateOfBirth: new Date('1980-01-01'),
        departmentId: 'departmentId' in s ? (s as any).departmentId : undefined,
      },
    });
    staffProfiles.push(staff);
  }

  console.log('Staff and Users created');

  // Update Faculty Dean and Dept HOD links
  await prisma.faculty.update({
    where: { id: engineering.id },
    data: { deanId: 'dean-eng' },
  });

  await prisma.department.update({
    where: { id: computerScience.id },
    data: { hodId: 'hod-csc' },
  });

  // 5. Create Students (Expanded to 500)
  console.log('Creating 500 students...');
  const students: any[] = [];
  const departments = [computerScience, mechanicalEng, physics];

  for (let i = 1; i <= 500; i++) {
    const dept = departments[i % departments.length];
    const email = `student${i}.${dept.code.toLowerCase()}@sumas.edu`;
    const matric = `2023/${dept.code}/${String(i).padStart(4, '0')}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: `student-${dept.code.toLowerCase()}-${i}`,
        email,
        name: `Student ${i}`,
        role: 'STUDENT',
        departmentId: dept.id,
      },
    });

    const student = await prisma.student.upsert({
      where: { matricNumber: matric },
      update: {},
      create: {
        userId: user.id,
        matricNumber: matric,
        level: 100,
        departmentId: dept.id,
      },
      include: { user: true },
    });
    students.push(student);

    if (i % 100 === 0) console.log(`Created ${i} students...`);
  }

  console.log('500 Students created');

  // 6. Create Courses
  const courses = [
    { code: 'CSC101', title: 'Introduction to Programming', credits: 3 },
    { code: 'CSC102', title: 'Data Structures', credits: 4 },
    { code: 'CSC201', title: 'Database Systems', credits: 3 },
    { code: 'MAT101', title: 'Calculus I', credits: 3 },
  ];

  const courseEntities: any[] = [];
  for (const c of courses) {
    // Determine which department owns the course
    const deptId = c.code.startsWith('CSC')
      ? computerScience.id
      : c.code.startsWith('MEE')
        ? mechanicalEng.id
        : physics.id;

    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        ...c,
        departmentId: deptId,
        semester: Semester.FIRST,
        academicYear: '2023/2024',
        level: c.code.includes('10') ? 100 : 200,
      },
    });
    courseEntities.push(course);

    // Assign Instructor (Lecturer 1 for all)
    await prisma.courseInstructor.upsert({
      where: {
        courseId_instructorId: {
          courseId: course.id,
          instructorId: staffProfiles.find((p) => p.staffNumber === 'L001')!.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        instructorId: staffProfiles.find((p) => p.staffNumber === 'L001')!.id,
        isPrimary: true,
      },
    });
  }

  console.log('Courses created');

  // 7. Enroll Students in Courses
  for (const student of students) {
    for (const course of courseEntities) {
      if (course.level === student.level) {
        await prisma.enrollment.upsert({
          where: {
            studentId_courseId: {
              studentId: student.id,
              courseId: course.id,
            },
          },
          update: {},
          create: {
            studentId: student.id,
            courseId: course.id,
            status: EnrollmentStatus.ACTIVE,
          },
        });
      }
    }
  }

  console.log('Enrollments created');

  // 8. Create Results with varied statuses
  const resultsData = [
    // CSC101 - All Pending Senate (Stage 4)
    { courseCode: 'CSC101', status: ResultStatus.DEAN_APPROVED },
    // CSC102 - All Pending Dean (Stage 3)
    { courseCode: 'CSC102', status: ResultStatus.HOD_APPROVED },
    // MAT101 - All Pending HOD (Stage 2)
    { courseCode: 'MAT101', status: ResultStatus.PENDING },
  ];

  const lecturerId = staffProfiles.find((p) => p.staffNumber === 'L001')!.id;

  for (const rd of resultsData) {
    const course = courseEntities.find((c) => c.code === rd.courseCode)!;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      if (course.level !== student.level) continue;

      const score = 40 + Math.random() * 50; // Random score between 40 and 90
      let grade = 'F';
      let gp = 0;
      if (score >= 70) {
        grade = 'A';
        gp = 5;
      } else if (score >= 60) {
        grade = 'B';
        gp = 4;
      } else if (score >= 50) {
        grade = 'C';
        gp = 3;
      } else if (score >= 45) {
        grade = 'D';
        gp = 2;
      } else if (score >= 40) {
        grade = 'E';
        gp = 1;
      }

      const result = await prisma.result.upsert({
        where: {
          studentId_courseId_semester_session: {
            studentId: student.id,
            courseId: course.id,
            semester: course.semester,
            session: course.academicYear,
          },
        },
        update: { status: rd.status },
        create: {
          studentId: student.id,
          courseId: course.id,
          ca: 30,
          exam: score - 30,
          score: score,
          grade: grade,
          gradePoint: gp,
          status: rd.status,
          semester: course.semester,
          session: course.academicYear,
          uploadedById: lecturerId,
        },
      });

      // Create Approval Record
      await prisma.approval.upsert({
        where: { resultId: result.id },
        update: {
          hodStatus:
            rd.status === ResultStatus.PENDING
              ? ApprovalStatus.PENDING
              : ApprovalStatus.APPROVED,
          deanStatus:
            rd.status === ResultStatus.HOD_APPROVED ||
            rd.status === ResultStatus.DEAN_APPROVED
              ? rd.status === ResultStatus.DEAN_APPROVED
                ? ApprovalStatus.APPROVED
                : ApprovalStatus.PENDING
              : ApprovalStatus.PENDING,
          hodApprovedBy:
            rd.status !== ResultStatus.PENDING
              ? { connect: { id: 'hod-csc' } }
              : undefined,
          hodApprovedAt: rd.status !== ResultStatus.PENDING ? new Date() : null,
          deanApprovedBy:
            rd.status === ResultStatus.DEAN_APPROVED
              ? { connect: { id: 'dean-eng' } }
              : undefined,
          deanApprovedAt:
            rd.status === ResultStatus.DEAN_APPROVED ? new Date() : null,
        },
        create: {
          resultId: result.id,
          hodStatus:
            rd.status === ResultStatus.PENDING
              ? ApprovalStatus.PENDING
              : ApprovalStatus.APPROVED,
          deanStatus:
            rd.status === ResultStatus.DEAN_APPROVED
              ? ApprovalStatus.APPROVED
              : ApprovalStatus.PENDING,
          hodApprovedById:
            rd.status !== ResultStatus.PENDING ? 'hod-csc' : null,
          hodApprovedAt: rd.status !== ResultStatus.PENDING ? new Date() : null,
          deanApprovedById:
            rd.status === ResultStatus.DEAN_APPROVED ? 'dean-eng' : null,
          deanApprovedAt:
            rd.status === ResultStatus.DEAN_APPROVED ? new Date() : null,
        },
      });
    }
  }

  console.log('Results and Approvals created');
  console.log('--- Seeding Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
