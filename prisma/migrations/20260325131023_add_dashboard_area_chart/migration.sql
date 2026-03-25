-- CreateTable
CREATE TABLE "DashboardBarChart" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "desktop" INTEGER NOT NULL,
    "mobile" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DashboardBarChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardAreaChart" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "desktop" INTEGER NOT NULL,
    "mobile" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DashboardAreaChart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardAreaChart_userId_month_key" ON "DashboardAreaChart"("userId", "month");

-- AddForeignKey
ALTER TABLE "DashboardBarChart" ADD CONSTRAINT "DashboardBarChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardAreaChart" ADD CONSTRAINT "DashboardAreaChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
