# Database Scripts

This directory contains utility scripts for managing the database.

## Enroll Students Script

**File:** `enroll-students.ts`

**Purpose:** Bulk enrolls all active students to all courses in the system.

### Usage

```bash
# From the backend directory
cd apps/backend

# Run the script
npx tsx scripts/enroll-students.ts
```

### What it does

1. Fetches all active students from the database
2. Fetches all courses from the database
3. Checks for existing enrollments to avoid duplicates
4. Creates new enrollment records for each student-course pair
5. Provides detailed progress and summary information

### Output

The script will show:

- Number of students found
- Number of courses found
- Number of existing enrollments
- Number of new enrollments created
- Summary statistics

### Requirements

- Students must exist in the database with `status = ACTIVE`
- Courses must exist in the database
- Prisma must be properly configured

### Safety Features

- ✅ Skips duplicate enrollments automatically
- ✅ Uses `skipDuplicates: true` for extra safety
- ✅ Validates data before creating enrollments
- ✅ Provides detailed logging for transparency
