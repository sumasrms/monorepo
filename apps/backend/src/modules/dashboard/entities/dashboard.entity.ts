import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  studentCount: number;

  @Field(() => Int)
  staffCount: number;

  @Field(() => Int)
  courseCount: number;

  @Field(() => Int)
  departmentCount: number;

  @Field(() => Int)
  facultyCount: number;
}

@ObjectType()
export class ChartDataPoint {
  @Field()
  name: string; // e.g., Faculty Name

  @Field(() => Int)
  value: number; // e.g., Student Count
}

@ObjectType()
export class DashboardAnalytics {
  @Field(() => [ChartDataPoint])
  studentsByFaculty: ChartDataPoint[];
}

@ObjectType()
export class RecentActivity {
  @Field()
  id: string;

  @Field()
  type: string; // "STUDENT", "STAFF", "COURSE"

  @Field()
  description: string;

  @Field()
  timestamp: Date;
}
