# Many-to-Many

Many-to-many (n:m) relationships depict a scenario where multiple records from one table can relate to multiple records in another table. The Serverpod framework supports these complex relationships by explicitly creating a third model to store the relation in.

## Overview

In the context of many-to-many relationships, neither table contains a direct reference to the other. Instead, a separate table, often called a junction or bridge table, holds the foreign keys of both tables. This setup allows for a flexible and normalized approach to represent relationships where multiple records from one table can be associated with multiple records from another table.

For instance, consider the relationship between `Student` and `Course`. A single student can enroll in multiple courses, and a single course can have multiple students. This is a classic many-to-many relationship, which is managed using the `Enrollment` table in Serverpod.

## Defining the Relationship

### Course & Student Tables

Both the `Course` and `Student` tables have a direct relationship with the `Enrollment` table but no direct relationship with each other.

```yaml
# course.yaml
class: Course
table: course
fields:
  name: String
  enrollments: List<Enrollment>?, relation(name=course_enrollments)
```

```yaml
# student.yaml
class: Student
table: student
fields:
  name: String
  enrollments: List<Enrollment>?, relation(name=student_enrollments)
```

### Enrollment Table

The `Enrollment` table acts as the bridge between `Course` and `Student`. It contains foreign keys from both tables, representing the many-to-many relationship. The unique index on the combination of `studentId` and `courseId` ensures that a student can only be enrolled in a particular course once.

```yaml
# enrollment.yaml
class: Enrollment
table: enrollment
fields:
  student: Student?, relation(name=student_enrollments)
  course: Course?, relation(name=course_enrollments)
indexes:
  enrollment_index_idx:
    fields: studentId, courseId
    unique: true
```
