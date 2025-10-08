-- DropForeignKey
ALTER TABLE "public"."Contract" DROP CONSTRAINT "Contract_investorId_fkey";

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "InvestorProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "BrokerProfile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
