-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('stripe', 'paypal');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "BillingPlanStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "AppSubscriptionStatus" AS ENUM ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'expired');

-- CreateEnum
CREATE TYPE "BillingCheckoutStatus" AS ENUM ('created', 'completed', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "BillingInvoiceStatus" AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible', 'failed');

-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" "BillingInterval" NOT NULL,
    "features" JSONB NOT NULL DEFAULT '[]',
    "status" "BillingPlanStatus" NOT NULL DEFAULT 'active',
    "stripePriceId" TEXT,
    "paypalPlanId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "status" "AppSubscriptionStatus" NOT NULL DEFAULT 'incomplete',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCheckoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "providerSessionId" TEXT,
    "status" "BillingCheckoutStatus" NOT NULL DEFAULT 'created',
    "checkoutUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "subscriptionId" TEXT,
    "provider" "BillingProvider" NOT NULL,
    "providerInvoiceId" TEXT,
    "providerSubscriptionId" TEXT,
    "status" "BillingInvoiceStatus" NOT NULL DEFAULT 'open',
    "amountDue" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "hostedInvoiceUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_code_key" ON "BillingPlan"("code");

-- CreateIndex
CREATE INDEX "BillingPlan_status_displayOrder_idx" ON "BillingPlan"("status", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AppSubscription_providerSubscriptionId_key" ON "AppSubscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "AppSubscription_userId_status_idx" ON "AppSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "AppSubscription_planId_idx" ON "AppSubscription"("planId");

-- CreateIndex
CREATE INDEX "AppSubscription_provider_providerSubscriptionId_idx" ON "AppSubscription"("provider", "providerSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCheckoutSession_providerSessionId_key" ON "BillingCheckoutSession"("providerSessionId");

-- CreateIndex
CREATE INDEX "BillingCheckoutSession_userId_status_idx" ON "BillingCheckoutSession"("userId", "status");

-- CreateIndex
CREATE INDEX "BillingCheckoutSession_provider_providerSessionId_idx" ON "BillingCheckoutSession"("provider", "providerSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoice_providerInvoiceId_key" ON "BillingInvoice"("providerInvoiceId");

-- CreateIndex
CREATE INDEX "BillingInvoice_userId_provider_idx" ON "BillingInvoice"("userId", "provider");

-- CreateIndex
CREATE INDEX "BillingInvoice_subscriptionId_idx" ON "BillingInvoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "BillingInvoice_provider_providerInvoiceId_idx" ON "BillingInvoice"("provider", "providerInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingWebhookEvent_provider_providerEventId_key" ON "BillingWebhookEvent"("provider", "providerEventId");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_provider_eventType_idx" ON "BillingWebhookEvent"("provider", "eventType");

-- CreateIndex
CREATE INDEX "BillingWebhookEvent_processedAt_idx" ON "BillingWebhookEvent"("processedAt");

-- AddForeignKey
ALTER TABLE "AppSubscription" ADD CONSTRAINT "AppSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSubscription" ADD CONSTRAINT "AppSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCheckoutSession" ADD CONSTRAINT "BillingCheckoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCheckoutSession" ADD CONSTRAINT "BillingCheckoutSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "AppSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
