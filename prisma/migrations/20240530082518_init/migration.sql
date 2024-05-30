-- AlterTable
ALTER TABLE "Reaction" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "DownloadedFormulaGroup" (
    "userId" INTEGER NOT NULL,
    "formulaGroupId" INTEGER NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DownloadedFormulaGroup_pkey" PRIMARY KEY ("userId","formulaGroupId")
);

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadedFormulaGroup" ADD CONSTRAINT "DownloadedFormulaGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadedFormulaGroup" ADD CONSTRAINT "DownloadedFormulaGroup_formulaGroupId_fkey" FOREIGN KEY ("formulaGroupId") REFERENCES "FormulaGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
