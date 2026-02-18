import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  UploadResultInput,
  UpdateResultInput,
  RequestEditInput,
  HodApproveResultsInput,
  HodRejectResultsInput,
  DeanApproveResultsInput,
  DeanRejectResultsInput,
  SenateApproveResultsInput,
  SenateRejectResultsInput,
  SubmitResultsInput,
} from './entities/result.entity';
import {
  NotificationType,
  Prisma,
  ResultStatus,
  Semester,
} from '@prisma/client';
import { SessionService } from '../session/session.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ResultService {
  constructor(
    private prisma: PrismaService,
    private sessionService: SessionService,
    private notificationsService: NotificationsService,
  ) {}

  private async createAuditLog(
    prisma: Prisma.TransactionClient | PrismaService,
    data: {
      resultId: string;
      action: string;
      reason?: string | null;
      actorId?: string | null;
      actorRole?: string | null;
      metadata?: Prisma.InputJsonValue | null;
    },
  ) {
    const metadata =
      data.metadata === undefined || data.metadata === null
        ? Prisma.JsonNull
        : data.metadata;

    await prisma.resultAudit.create({
      data: {
        resultId: data.resultId,
        action: data.action,
        reason: data.reason ?? null,
        actorId: data.actorId ?? null,
        actorRole: data.actorRole ?? null,
        metadata,
      },
    });
  }

  async uploadResults(input: UploadResultInput, uploadedById: string) {
    let { courseId, semester, session, results } = input;

    // Default to current academic settings if not provided
    if (!semester || !session) {
      const settings = await this.sessionService.getAcademicSettings();
      if (!settings) {
        throw new Error(
          'Academic settings not found. Please configure the current session and semester.',
        );
      }
      semester = semester || settings.currentSemester;
      session = session || (settings.currentSession as any)?.session;

      if (!session) {
        throw new Error(
          'Current session not active. Please set an active session.',
        );
      }
    }

    // Convert semester string to enum value
    const semesterEnum = semester.toUpperCase() as Semester;

    // Validate course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const isPrimaryInstructor = await this.prisma.courseInstructor.findFirst({
      where: {
        courseId,
        instructorId: uploadedById,
        isPrimary: true,
      },
    });

    if (!isPrimaryInstructor) {
      throw new Error(
        'Only the primary lecturer can upload or submit results for this course.',
      );
    }

    // Fetch all students with their departments and grade scales
    const studentIds = results.map((r) => r.studentId);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        user: true,
        department: {
          include: {
            gradeScales: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const studentMap = new Map(students.map((s) => [s.id, s]));

    // Pre-validate: Check all students have grade configuration
    const studentsWithoutGradeConfig: string[] = [];
    for (const resultInput of results) {
      const student = studentMap.get(resultInput.studentId);
      if (!student) {
        throw new Error(`Student with ID ${resultInput.studentId} not found`);
      }

      if (!student.department) {
        studentsWithoutGradeConfig.push(
          `${student.user.name} (${student.matricNumber}) - No department assigned`,
        );
      } else if (
        !student.department.gradeScales ||
        student.department.gradeScales.length === 0
      ) {
        studentsWithoutGradeConfig.push(
          `${student.user.name} (${student.matricNumber}) - Department: ${student.department.name}`,
        );
      }
    }

    // If any students lack grade configuration, throw detailed error
    if (studentsWithoutGradeConfig.length > 0) {
      throw new Error(
        `Cannot upload results. The following students' departments have no grade configuration:\n${studentsWithoutGradeConfig.map((s) => `- ${s}`).join('\n')}\n\nPlease contact the department admin to configure grade scales.`,
      );
    }

    // Process each result
    const createdResults = await Promise.all(
      results.map(async (resultInput) => {
        const { studentId, ca = 0, exam = 0 } = resultInput;
        const student = studentMap.get(studentId)!;
        const gradeScales = student.department!.gradeScales;

        // Calculate total score
        const score = ca + exam;

        // Determine grade based on student's department grade scale
        const gradeConfig = gradeScales.find(
          (scale) => score >= scale.minScore && score <= scale.maxScore,
        );

        if (!gradeConfig) {
          throw new Error(
            `No grade configuration found for score ${score} in ${student.department!.name} department. Please check the grade scale configuration.`,
          );
        }

        const { grade, gradePoint } = gradeConfig;

        // Create or update result
        const savedResult = await this.prisma.result.upsert({
          where: {
            studentId_courseId_semester_session: {
              studentId,
              courseId,
              semester: semesterEnum,
              session,
            },
          },
          create: {
            studentId,
            courseId,
            ca,
            exam,
            score,
            grade,
            gradePoint,
            totalGradePoints: gradePoint * course.credits,
            semester: semesterEnum,
            session,
            uploadedById,
            status: ResultStatus.DRAFT,
          },
          update: {
            ca,
            exam,
            score,
            grade,
            gradePoint,
            totalGradePoints: gradePoint * course.credits,
            status: ResultStatus.DRAFT, // Reset to DRAFT on re-upload
            updatedAt: new Date(),
          },
          include: {
            student: {
              include: {
                user: true,
              },
            },
            course: true,
            uploadedBy: true,
          },
        });

        await this.createAuditLog(this.prisma, {
          resultId: savedResult.id,
          action: 'UPLOAD_RESULT',
          actorId: uploadedById,
          actorRole: 'LECTURER',
          metadata: {
            courseId,
            semester: semesterEnum,
            session,
          },
        });

        return savedResult;
      }),
    );

    return createdResults;
  }

  async getResultsByStudent(studentId: string) {
    return this.prisma.result.findMany({
      where: { studentId },
      include: {
        course: true,
      },
      orderBy: [
        { session: 'desc' },
        { semester: 'asc' },
      ],
    });
  }

  async updateResult(input: UpdateResultInput, staffId: string) {
    const { resultId, ca, exam } = input;

    // Fetch result with student's department and grade scales
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
      include: {
        course: true,
        student: {
          include: {
            user: true,
            department: {
              include: {
                gradeScales: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw new Error('Result not found');
    }

    // Check if result is still editable (DRAFT or REJECTED status)
    if (
      result.status !== ResultStatus.DRAFT &&
      result.status !== ResultStatus.REJECTED
    ) {
      throw new Error(
        `Cannot edit result in ${result.status} status. Please submit an edit request.`,
      );
    }

    // Verify staff is the uploader
    if (result.uploadedById !== staffId) {
      throw new Error('You can only edit results you uploaded');
    }

    // Validate student has department and grade configuration
    if (!result.student.department) {
      throw new Error(
        `Cannot update result. Student ${result.student.user.name} (${result.student.matricNumber}) has no department assigned.`,
      );
    }

    const gradeScales = result.student.department.gradeScales;
    if (!gradeScales || gradeScales.length === 0) {
      throw new Error(
        `Cannot update result. ${result.student.department.name} department has no grade configuration. Please contact the department admin to configure grade scales.`,
      );
    }

    const newCa = ca ?? result.ca ?? 0;
    const newExam = exam ?? result.exam ?? 0;
    const score = newCa + newExam;

    // Determine new grade based on student's department grade scale
    const gradeConfig = gradeScales.find(
      (scale) => score >= scale.minScore && score <= scale.maxScore,
    );

    if (!gradeConfig) {
      throw new Error(
        `No grade configuration found for score ${score} in ${result.student.department.name} department. Please check the grade scale configuration.`,
      );
    }

    const updatedResult = await this.prisma.result.update({
      where: { id: resultId },
      data: {
        ca: newCa,
        exam: newExam,
        score,
        grade: gradeConfig.grade,
        gradePoint: gradeConfig.gradePoint,
        totalGradePoints: gradeConfig.gradePoint * result.course.credits,
        status: ResultStatus.DRAFT, // Reset to DRAFT on edit
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        course: true,
        uploadedBy: true,
      },
    });

    await this.createAuditLog(this.prisma, {
      resultId: updatedResult.id,
      action: 'UPDATE_RESULT',
      actorId: staffId,
      actorRole: 'LECTURER',
      metadata: {
        ca: newCa,
        exam: newExam,
        score,
      },
    });

    return updatedResult;
  }

  async requestEdit(input: RequestEditInput, staffId: string) {
    const { resultId, reason } = input;

    // Verify result exists and staff is the uploader
    const result = await this.prisma.result.findUnique({
      where: { id: resultId },
    });

    if (!result) {
      throw new Error('Result not found');
    }

    if (result.uploadedById !== staffId) {
      throw new Error('You can only request edits for results you uploaded');
    }

    // Check if result is approved by HOD or later
    const allowedStatuses: ResultStatus[] = [
      ResultStatus.HOD_APPROVED,
      ResultStatus.DEAN_APPROVED,
      ResultStatus.SENATE_APPROVED,
      ResultStatus.PUBLISHED,
    ];

    if (!allowedStatuses.includes(result.status)) {
      throw new Error(
        'Result is not yet HOD-approved. You can edit it directly until approval.',
      );
    }

    // Create edit request
    const request = await this.prisma.resultEditRequest.create({
      data: {
        resultId,
        reason,
      },
      include: {
        result: {
          include: {
            student: true,
            course: true,
          },
        },
      },
    });

    await this.createAuditLog(this.prisma, {
      resultId,
      action: 'EDIT_REQUESTED',
      reason,
      actorId: staffId,
      actorRole: 'LECTURER',
    });

    return request;
  }

  async getEditRequests(staffId: string) {
    return this.prisma.resultEditRequest.findMany({
      where: {
        result: {
          uploadedById: staffId,
        },
      },
      include: {
        result: {
          include: {
            student: true,
            course: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResultsByCourse(
    courseId: string,
    semester: string,
    session: string,
  ) {
    // Convert semester string to enum value
    const semesterEnum = semester.toUpperCase() as 'FIRST' | 'SECOND';

    return this.prisma.result.findMany({
      where: {
        courseId,
        semester: semesterEnum,
        session,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        course: true,
        approval: true,
        uploadedBy: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        student: {
          matricNumber: 'asc',
        },
      },
    });
  }

  async hodApproveResults(input: HodApproveResultsInput, hodId: string) {
    const { resultIds, remarks } = input;

    return this.prisma.$transaction(async (tx) => {
      const results = await tx.result.findMany({
        where: { id: { in: resultIds } },
      });

      if (results.length !== resultIds.length) {
        throw new Error('Some results were not found');
      }

      // Verify all results are currently PENDING or REJECTED (if allowed to re-approve)
      // Usually, HOD approves PENDING results.
      const invalidResults = results.filter(
        (r) =>
          r.status !== ResultStatus.PENDING &&
          r.status !== ResultStatus.REJECTED,
      );
      if (invalidResults.length > 0) {
        throw new Error(
          'Some results are not in a state that can be approved by HOD',
        );
      }

      return Promise.all(
        resultIds.map(async (id) => {
          // Update result status
          const updatedResult = await tx.result.update({
            where: { id },
            data: {
              status: ResultStatus.HOD_APPROVED,
              updatedAt: new Date(),
            },
          });

          // Create or update approval record
          await tx.approval.upsert({
            where: { resultId: id },
            create: {
              resultId: id,
              hodStatus: 'APPROVED',
              hodApprovedById: hodId,
              hodApprovedAt: new Date(),
              hodRemarks: remarks,
            },
            update: {
              hodStatus: 'APPROVED',
              hodApprovedById: hodId,
              hodApprovedAt: new Date(),
              hodRemarks: remarks,
            },
          });

          await this.createAuditLog(tx, {
            resultId: updatedResult.id,
            action: 'HOD_APPROVED',
            reason: remarks,
            actorId: hodId,
            actorRole: 'HOD',
          });

          await this.createAuditLog(tx, {
            resultId: updatedResult.id,
            action: 'HOD_REJECTED',
            reason: remarks,
            actorId: hodId,
            actorRole: 'HOD',
          });

          return updatedResult;
        }),
      );
    });
  }

  async submitResultsToHod(input: SubmitResultsInput, staffId: string) {
    const { courseId, semester, session, resultIds } = input;
    const semesterEnum = semester.toUpperCase() as Semester;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        department: true,
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.department?.hodId) {
      throw new Error('HOD not configured for this department');
    }

    const isPrimaryInstructor = await this.prisma.courseInstructor.findFirst({
      where: {
        courseId,
        instructorId: staffId,
        isPrimary: true,
      },
    });

    if (!isPrimaryInstructor) {
      throw new Error(
        'Only the primary lecturer can submit results for this course.',
      );
    }

    const whereClause = {
      courseId,
      semester: semesterEnum,
      session,
      uploadedById: staffId,
      status: ResultStatus.DRAFT,
      ...(resultIds && resultIds.length > 0 ? { id: { in: resultIds } } : {}),
    };

    const results = await this.prisma.result.findMany({
      where: whereClause,
    });

    if (results.length === 0) {
      throw new Error('No draft results found to submit');
    }

    await this.prisma.result.updateMany({
      where: { id: { in: results.map((r) => r.id) } },
      data: {
        status: ResultStatus.PENDING,
        updatedAt: new Date(),
      },
    });

    await Promise.all(
      results.map((result) =>
        this.createAuditLog(this.prisma, {
          resultId: result.id,
          action: 'SUBMIT_TO_HOD',
          actorId: staffId,
          actorRole: 'LECTURER',
          metadata: {
            courseId,
            semester,
            session,
          },
        }),
      ),
    );

    await this.notificationsService.sendNotification({
      userId: course.department.hodId,
      type: NotificationType.RESULT_SUBMISSION,
      title: `Results submitted for ${course.code}`,
      message: `New results for ${course.code} (${semester} semester, ${session}) are awaiting your approval.`,
      data: {
        courseId,
        semester,
        session,
        submittedCount: results.length,
      },
      sendInApp: true,
      sendEmail: false,
      sendPush: false,
    });

    return this.prisma.result.findMany({
      where: { id: { in: results.map((r) => r.id) } },
      include: {
        student: { include: { user: true } },
        course: true,
        uploadedBy: { include: { user: true } },
        approval: true,
      },
    });
  }

  async hodRejectResults(input: HodRejectResultsInput, hodId: string) {
    const { resultIds, remarks } = input;

    return this.prisma.$transaction(async (tx) => {
      const results = await tx.result.findMany({
        where: { id: { in: resultIds } },
      });

      if (results.length !== resultIds.length) {
        throw new Error('Some results were not found');
      }

      return Promise.all(
        resultIds.map(async (id) => {
          // Update result status
          const updatedResult = await tx.result.update({
            where: { id },
            data: {
              status: ResultStatus.REJECTED,
              updatedAt: new Date(),
            },
          });

          // Create or update approval record
          await tx.approval.upsert({
            where: { resultId: id },
            create: {
              resultId: id,
              hodStatus: 'REJECTED',
              hodApprovedById: hodId,
              hodApprovedAt: new Date(),
              hodRemarks: remarks,
            },
            update: {
              hodStatus: 'REJECTED',
              hodApprovedById: hodId,
              hodApprovedAt: new Date(),
              hodRemarks: remarks,
            },
          });

          return updatedResult;
        }),
      );
    });
  }

  async getPendingResultsByDepartment(departmentId: string) {
    return this.prisma.result.findMany({
      where: {
        status: ResultStatus.PENDING,
        course: {
          departmentId: departmentId,
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        course: true,
        uploadedBy: {
          include: {
            user: true,
          },
        },
        approval: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPendingEditRequestsByDepartment(departmentId: string) {
    return this.prisma.resultEditRequest.findMany({
      where: {
        result: {
          course: {
            departmentId,
          },
        },
        status: 'PENDING',
      },
      include: {
        result: {
          include: {
            course: true,
            student: {
              include: {
                user: true,
              },
            },
            uploadedBy: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async getResultAuditsByDepartment(departmentId: string) {
    return this.prisma.resultAudit.findMany({
      where: {
        result: {
          course: {
            departmentId,
          },
        },
      },
      include: {
        result: {
          include: {
            course: true,
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResultAuditsByCourse(courseId: string, staffId: string) {
    return this.prisma.resultAudit.findMany({
      where: {
        result: {
          courseId,
          uploadedById: staffId,
        },
      },
      include: {
        result: {
          include: {
            course: true,
            student: {
              include: {
                user: true,
              },
            },
            approval: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResultAuditsForSenate() {
    return this.prisma.resultAudit.findMany({
      include: {
        result: {
          include: {
            course: {
              include: {
                department: {
                  include: {
                    faculty: true,
                  },
                },
              },
            },
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResultsByDepartment(
    departmentId: string,
    filters: {
      courseId?: string;
      semester?: string;
      session?: string;
    },
  ) {
    return this.prisma.result.findMany({
      where: {
        course: {
          departmentId,
        },
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.semester
          ? { semester: filters.semester as any }
          : {}),
        ...(filters.session ? { session: filters.session } : {}),
      },
      include: {
        course: true,
        student: {
          include: {
            user: true,
          },
        },
        uploadedBy: {
          include: {
            user: true,
          },
        },
        approval: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResultsByFaculty(
    facultyId: string,
    filters: {
      departmentId?: string;
      courseId?: string;
      semester?: string;
      session?: string;
    },
  ) {
    return this.prisma.result.findMany({
      where: {
        course: {
          department: {
            facultyId,
            ...(filters.departmentId
              ? { id: filters.departmentId }
              : {}),
          },
        },
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.semester
          ? { semester: filters.semester as any }
          : {}),
        ...(filters.session ? { session: filters.session } : {}),
      },
      include: {
        course: {
          include: {
            department: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        uploadedBy: {
          include: {
            user: true,
          },
        },
        approval: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResultsForSenate(filters: {
    facultyId?: string;
    departmentId?: string;
    courseId?: string;
    semester?: string;
    session?: string;
    status?: string;
  }) {
    const courseFilter =
      filters.facultyId || filters.departmentId
        ? {
            department: {
              ...(filters.departmentId
                ? { id: filters.departmentId }
                : {}),
              ...(filters.facultyId ? { facultyId: filters.facultyId } : {}),
            },
          }
        : undefined;

    return this.prisma.result.findMany({
      where: {
        ...(courseFilter ? { course: courseFilter } : {}),
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.semester
          ? { semester: filters.semester as any }
          : {}),
        ...(filters.session ? { session: filters.session } : {}),
        ...(filters.status
          ? { status: filters.status as ResultStatus }
          : {}),
      },
      include: {
        course: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        uploadedBy: {
          include: {
            user: true,
          },
        },
        approval: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getResultAuditsByFaculty(
    facultyId: string,
    departmentId?: string,
  ) {
    return this.prisma.resultAudit.findMany({
      where: {
        result: {
          course: {
            department: {
              facultyId,
              ...(departmentId ? { id: departmentId } : {}),
            },
          },
        },
      },
      include: {
        result: {
          include: {
            course: {
              include: {
                department: true,
              },
            },
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approveEditRequest(id: string) {
    const request = await this.prisma.resultEditRequest.findUnique({
      where: { id },
      include: { result: true },
    });

    if (!request) throw new Error('Edit request not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Approve the request
      const updatedRequest = await tx.resultEditRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // 2. Set result status back to PENDING to allow edits
      await tx.result.update({
        where: { id: request.resultId },
        data: { status: ResultStatus.PENDING },
      });

      await this.createAuditLog(tx, {
        resultId: request.resultId,
        action: 'EDIT_REQUEST_APPROVED',
      });

      return updatedRequest;
    });
  }

  async rejectEditRequest(id: string, remarks: string) {
    const updatedRequest = await this.prisma.resultEditRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await this.createAuditLog(this.prisma, {
      resultId: updatedRequest.resultId,
      action: 'EDIT_REQUEST_REJECTED',
      reason: remarks,
    });

    return updatedRequest;
  }

  async getPendingResultsByFaculty(facultyId: string) {
    return this.prisma.result.findMany({
      where: {
        status: ResultStatus.HOD_APPROVED,
        course: {
          department: {
            facultyId,
          },
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        course: {
          include: {
            department: true,
          },
        },
        uploadedBy: {
          include: {
            user: true,
          },
        },
        approval: {
          include: {
            hodApprovedBy: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async deanApproveResults(input: DeanApproveResultsInput, deanId: string) {
    const { resultIds, remarks } = input;

    return this.prisma.$transaction(async (tx) => {
      const results = await tx.result.findMany({
        where: { id: { in: resultIds } },
      });

      if (results.length !== resultIds.length) {
        throw new Error('Some results were not found');
      }

      const invalidResults = results.filter(
        (r) => r.status !== ResultStatus.HOD_APPROVED,
      );
      if (invalidResults.length > 0) {
        throw new Error(
          'Some results are not in a state that can be approved by Dean (must be HOD_APPROVED)',
        );
      }

      return Promise.all(
        resultIds.map(async (id) => {
          await tx.result.update({
            where: { id },
            data: {
              status: ResultStatus.DEAN_APPROVED,
              updatedAt: new Date(),
            },
          });

          await tx.approval.update({
            where: { resultId: id },
            data: {
              deanStatus: 'APPROVED',
              deanApprovedById: deanId,
              deanApprovedAt: new Date(),
              deanRemarks: remarks,
            },
          });

          await this.createAuditLog(tx, {
            resultId: id,
            action: 'DEAN_APPROVED',
            reason: remarks,
            actorId: deanId,
            actorRole: 'DEAN',
          });
        }),
      );
    });
  }

  async deanRejectResults(input: DeanRejectResultsInput, deanId: string) {
    const { resultIds, remarks } = input;

    return this.prisma.$transaction(async (tx) => {
      const results = await tx.result.findMany({
        where: { id: { in: resultIds } },
      });

      if (results.length !== resultIds.length) {
        throw new Error('Some results were not found');
      }

      return Promise.all(
        resultIds.map(async (id) => {
          await tx.result.update({
            where: { id },
            data: {
              status: ResultStatus.REJECTED,
              updatedAt: new Date(),
            },
          });

          await tx.approval.update({
            where: { resultId: id },
            data: {
              deanStatus: 'REJECTED',
              deanApprovedById: deanId,
              deanApprovedAt: new Date(),
              deanRemarks: remarks,
            },
          });

          await this.createAuditLog(tx, {
            resultId: id,
            action: 'DEAN_REJECTED',
            reason: remarks,
            actorId: deanId,
            actorRole: 'DEAN',
          });
        }),
      );
    });
  }

  async getPendingResultsForSenate() {
    return this.prisma.result.findMany({
      where: {
        status: ResultStatus.DEAN_APPROVED,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        course: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
          },
        },
        uploadedBy: {
          include: {
            user: true,
          },
        },
        approval: {
          include: {
            hodApprovedBy: true,
            deanApprovedBy: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async senateApproveResults(
    input: SenateApproveResultsInput,
    senateId: string,
  ) {
    const { resultIds, remarks } = input;

    return this.prisma.$transaction(async (tx) => {
      const results = await tx.result.findMany({
        where: { id: { in: resultIds } },
      });

      if (results.length !== resultIds.length) {
        throw new Error('Some results were not found');
      }

      const invalidResults = results.filter(
        (r) => r.status !== ResultStatus.DEAN_APPROVED,
      );
      if (invalidResults.length > 0) {
        throw new Error(
          'Some results are not in a state that can be approved by Senate (must be DEAN_APPROVED)',
        );
      }

      return Promise.all(
        resultIds.map(async (id) => {
          await tx.result.update({
            where: { id },
            data: {
              status: ResultStatus.SENATE_APPROVED,
              updatedAt: new Date(),
            },
          });

          await tx.approval.update({
            where: { resultId: id },
            data: {
              senateStatus: 'APPROVED',
              senateApprovedById: senateId,
              senateApprovedAt: new Date(),
              senateRemarks: remarks,
            },
          });

          await this.createAuditLog(tx, {
            resultId: id,
            action: 'SENATE_APPROVED',
            reason: remarks,
            actorId: senateId,
            actorRole: 'SENATE',
          });
        }),
      );
    });
  }

  async senateRejectResults(input: SenateRejectResultsInput, senateId: string) {
    const { resultIds, remarks } = input;

    return this.prisma.$transaction(async (tx) => {
      const results = await tx.result.findMany({
        where: { id: { in: resultIds } },
      });

      if (results.length !== resultIds.length) {
        throw new Error('Some results were not found');
      }

      return Promise.all(
        resultIds.map(async (id) => {
          await tx.result.update({
            where: { id },
            data: {
              status: ResultStatus.REJECTED,
              updatedAt: new Date(),
            },
          });

          await tx.approval.update({
            where: { resultId: id },
            data: {
              senateStatus: 'REJECTED',
              senateApprovedById: senateId,
              senateApprovedAt: new Date(),
              senateRemarks: remarks,
            },
          });

          await this.createAuditLog(tx, {
            resultId: id,
            action: 'SENATE_REJECTED',
            reason: remarks,
            actorId: senateId,
            actorRole: 'SENATE',
          });
        }),
      );
    });
  }

  async authorizePublication(resultIds: string[]) {
    await this.prisma.result.updateMany({
      where: {
        id: { in: resultIds },
        status: ResultStatus.SENATE_APPROVED,
      },
      data: {
        status: ResultStatus.PUBLISHED,
        updatedAt: new Date(),
      },
    });

    await Promise.all(
      resultIds.map((id) =>
        this.createAuditLog(this.prisma, {
          resultId: id,
          action: 'RESULT_PUBLISHED',
          actorRole: 'SENATE',
        }),
      ),
    );
  }
}
