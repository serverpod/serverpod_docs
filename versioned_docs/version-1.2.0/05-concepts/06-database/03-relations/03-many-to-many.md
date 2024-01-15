# Many-to-Many

Many-to-many (n:m) relationships describes a scenario where multiple records from a table can relate to multiple records in another table. An example of this would be the relationship between students and courses, where a single student can enroll in multiple courses, and a single course can have multiple students.

The Serverpod framework supports these complex relationships by explicitly creating a separate model, often called a junction or bridge table, that records the relation.

## Overview

In the context of many-to-many relationships, neither table contains a direct reference to the other. Instead, a separate table holds the foreign keys of both tables. This setup allows for a flexible and normalized approach to represent n:m relationships.

Modeling the relationship between `Student` and `Course`, we would create an `Enrollment` model as a junction table to store the relationship explicitly.

## Defining the Relationship

In the following examples we show how to configure a n:m relationship between `Student` and `Course`.

### Many tables

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

Note that the `name` argument is different, `course_enrollments` and `student_enrollments`, for the many tables. This is because each row in the junction table holds a relation to both many tables, `Course` and `Student`.

### Junction Table

The `Enrollment` table acts as the bridge between `Course` and `Student`. It contains foreign keys from both tables, representing the many-to-many relationship. 

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

The unique index on the combination of `studentId` and `courseId` ensures that a student can only be enrolled in a particular course once. If omitted a student would be allowed to be enrolled in the same course multiple times.