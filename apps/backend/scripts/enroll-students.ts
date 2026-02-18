import prisma from '../lib/prisma';
import { Prisma, EnrollmentStatus } from '@prisma/client';

async function enrollStudents() {
  try {
    console.log('🚀 Starting student enrollment process...\n');

    // Fetch all students
    const students = await prisma.student.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        matricNumber: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📚 Found ${students.length} active students`);

    // Fetch all courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        title: true,
      },
    });

    console.log(`📖 Found ${courses.length} courses\n`);

    if (students.length === 0) {
      console.log(
        '⚠️  No active students found. Please create students first.',
      );
      return;
    }

    if (courses.length === 0) {
      console.log('⚠️  No courses found. Please create courses first.');
      return;
    }

    // Get existing enrollments to avoid duplicates
    const existingEnrollments = await prisma.enrollment.findMany({
      select: {
        studentId: true,
        courseId: true,
      },
    });

    const existingSet = new Set(
      existingEnrollments.map((e) => `${e.studentId}-${e.courseId}`),
    );

    console.log(
      `✅ Found ${existingEnrollments.length} existing enrollments\n`,
    );

    // Create enrollments for each student-course pair
    const enrollmentsToCreate: Prisma.EnrollmentCreateManyInput[] = [];
    let skipped = 0;

    for (const student of students) {
      for (const course of courses) {
        const key = `${student.id}-${course.id}`;

        if (existingSet.has(key)) {
          skipped++;
          continue;
        }

        enrollmentsToCreate.push({
          studentId: student.id,
          courseId: course.id,
          status: EnrollmentStatus.ACTIVE,
        });
      }
    }

    console.log(`📝 Creating ${enrollmentsToCreate.length} new enrollments...`);
    console.log(`⏭️  Skipping ${skipped} existing enrollments\n`);

    if (enrollmentsToCreate.length === 0) {
      console.log('✨ All students are already enrolled in all courses!');
      return;
    }

    // Bulk create enrollments
    const result = await prisma.enrollment.createMany({
      data: enrollmentsToCreate,
      skipDuplicates: true,
    });

    console.log(`\n✅ Successfully created ${result.count} enrollments!`);
    console.log('\n📊 Summary:');
    console.log(`   • Students: ${students.length}`);
    console.log(`   • Courses: ${courses.length}`);
    console.log(
      `   • Total possible enrollments: ${students.length * courses.length}`,
    );
    console.log(`   • New enrollments created: ${result.count}`);
    console.log(`   • Already enrolled: ${skipped}`);
    console.log('\n🎉 Enrollment process completed successfully!');
  } catch (error) {
    console.error('❌ Error enrolling students:', error);
    throw error;
  }
}

// Run the script
enrollStudents()
  .then(() => {
    console.log('\n✨ Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
