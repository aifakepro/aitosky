-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactno" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "firstname" TEXT,
ADD COLUMN     "lastname" TEXT;

-- CreateTable
CREATE TABLE "UserJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobcountry" TEXT NOT NULL,
    "jobcity" TEXT NOT NULL,
    "jobtitle" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "startdate" TEXT NOT NULL,
    "enddate" TEXT NOT NULL,

    CONSTRAINT "UserJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserJob" ADD CONSTRAINT "UserJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
