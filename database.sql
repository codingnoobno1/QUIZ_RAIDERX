
-- #############################################################################
-- SQL Schema from databaseconnect.sql (SQL Server)
-- #############################################################################

CREATE DATABASE MyDatabase;
GO
USE MyDatabase;
GO

-- TABLE: Assignments
CREATE TABLE dbo.Assignments (
    FacultyId       VARCHAR(100) NULL,
    Batch           VARCHAR(100) NULL,
    Semester        INT NULL,
    CreatedAt       DATETIME NULL,
    UpdatedAt       DATETIME NULL,
    Subject         NVARCHAR(200) NULL
);
GO

-- TABLE: Batches
CREATE TABLE dbo.Batches (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    CourseId        INT NULL,
    Section         NVARCHAR(20) NULL,
    SemesterNumber  INT NOT NULL,
    RoomNumber      NVARCHAR(100) NULL,
    BatchLabel      NVARCHAR(200) NULL
);
GO

-- TABLE: Courses
CREATE TABLE dbo.Courses (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(200) NOT NULL
);
GO

-- TABLE: Faculties
CREATE TABLE dbo.Faculties (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(200) NULL,
    Email           NVARCHAR(200) NULL,
    Password        NVARCHAR(1020) NULL,
    Role            NVARCHAR(80) NULL,
    Position        NVARCHAR(200) NULL,
    AmiId           NVARCHAR(200) NULL,
    UUID            UNIQUEIDENTIFIER NULL,
    CreatedAt       DATETIME2 NULL,
    UpdatedAt       DATETIME2 NULL,
    Department      NVARCHAR(200) NULL
);
GO

-- TABLE: FacultyAssignments
CREATE TABLE dbo.FacultyAssignments (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    FacultyId       INT NOT NULL,
    SubjectId       INT NOT NULL,
    BatchId         INT NOT NULL
);
GO

-- TABLE: FacultyRoles
CREATE TABLE dbo.FacultyRoles (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    FacultyId       INT NOT NULL,
    Role            NVARCHAR(200) NOT NULL
);
GO

-- TABLE: Options
CREATE TABLE dbo.Options (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    QuestionId      INT NULL,
    Text            NVARCHAR(MAX) NULL,
    IsCorrect       BIT NULL
);
GO

-- TABLE: Questions
CREATE TABLE dbo.Questions (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    QuizId          INT NULL,
    Text            NVARCHAR(MAX) NULL,
    CorrectAnswer   NVARCHAR(MAX) NULL
);
GO

-- Relationships (guessed from names, adjust as needed)
ALTER TABLE dbo.Batches
    ADD CONSTRAINT FK_Batches_Courses FOREIGN KEY (CourseId)
    REFERENCES dbo.Courses(Id);

ALTER TABLE dbo.FacultyAssignments
    ADD CONSTRAINT FK_FacultyAssignments_Faculties FOREIGN KEY (FacultyId)
    REFERENCES dbo.Faculties(Id);

ALTER TABLE dbo.FacultyAssignments
    ADD CONSTRAINT FK_FacultyAssignments_Batches FOREIGN KEY (BatchId)
    REFERENCES dbo.Batches(Id);

ALTER TABLE dbo.Options
    ADD CONSTRAINT FK_Options_Questions FOREIGN KEY (QuestionId)
    REFERENCES dbo.Questions(Id);
GO


-- #############################################################################
-- SQL Schema from prisma/schema.prisma (PostgreSQL)
-- #############################################################################

/*
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Define Role Enum
enum Role {
  user
  student
  admin
}

model BaseUser {
  id               Int      @id @default(autoincrement())
  uuid             String   @unique @default(uuid())
  name             String
  enrollmentNumber String   @unique
  course           String
  semester         String
  email            String   @unique
  password         String
  role             Role     @default(user)  // Use the Role enum here
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relationship with Student
  student          Student? @relation

  // Prisma does not support password hashing inside schema, handle it in application logic
}

model Student {
  id             Int      @id @default(autoincrement())
  baseUser       BaseUser @relation(fields: [baseUserId], references: [id])
  baseUserId     Int      @unique // Add @unique here for a one-to-one relationship
  subjects       Subject[]

  // Additional fields for Student
  enrollmentDate DateTime @default(now())
}

model Subject {
  id        Int     @id @default(autoincrement())
  name      String
  student   Student @relation(fields: [studentId], references: [id])
  studentId Int
  quizzes   Quiz[]

  // Additional fields related to the subject
}

model Quiz {
  id        Int    @id @default(autoincrement())
  name      String
  subject   Subject @relation(fields: [subjectId], references: [id])
  subjectId Int

  // Additional fields related to quizzes (e.g., scores, answers, etc.)
}
*/
