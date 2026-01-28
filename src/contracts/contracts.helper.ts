import { CreateContractWithFormDataDto } from './dto/contract.dto';
/**
 * Builds a data object for Prisma create based on the contract DTO.
 * @param dto CreateContractWithFormDataDto
 * @returns Prisma.ContractCreateInput
 */
export function buildContractCreateData(dto: CreateContractWithFormDataDto): Prisma.ContractCreateInput {
  return {
    filesUrl: dto.filesUrl || [],
    signedDate: dto.signedDate,
    contractStart: dto.contractStart,
    contractEnd: dto.contractEnd,
    contractValue: dto.contractValue,
    depositPaid: dto.depositPaid,
    investorPaymentMethod: dto.investorPaymentMethod,
    paymentSchedule: dto.paymentSchedule,
    vacancyRiskLevel: dto.vacancyRiskLevel,
    status: dto.status || 'draft',
    notes: dto.notes,
    formData: dto.formData as Prisma.InputJsonValue,
    property: { connect: { id: dto.propertyId } },
    investor: { connect: { userId: dto.investorId } },
    ...(dto.brokerId && { broker: { connect: { userId: dto.brokerId } } }),
  };
}
// contracts.helper.ts
// Helper functions for contracts service (e.g., clearing, merging, and update data building)
import { Prisma } from '@prisma/client';
import { UpdateContractDto } from './dto/contract.dto';

/**
 * Builds an update data object for Prisma update based on non-undefined fields in the DTO.
 * @param dto UpdateContractDto
 * @returns Partial<Prisma.ContractUpdateInput>
 */
export function buildContractUpdateData(dto: UpdateContractDto): Partial<Prisma.ContractUpdateInput> {
  const updateData: any = {};
  if (dto.brokerId !== undefined) updateData.brokerId = dto.brokerId;
  if (dto.fileUrl !== undefined) updateData.fileUrl = dto.fileUrl;
  if (dto.filesUrl !== undefined) updateData.filesUrl = dto.filesUrl;
  if (dto.signedDate !== undefined) updateData.signedDate = dto.signedDate;
  if (dto.contractStart !== undefined) updateData.contractStart = dto.contractStart;
  if (dto.contractEnd !== undefined) updateData.contractEnd = dto.contractEnd;
  if (dto.contractValue !== undefined) updateData.contractValue = dto.contractValue;
  if (dto.depositPaid !== undefined) updateData.depositPaid = dto.depositPaid;
  if (dto.investorPaymentMethod !== undefined) updateData.investorPaymentMethod = dto.investorPaymentMethod;
  if (dto.paymentSchedule !== undefined) updateData.paymentSchedule = dto.paymentSchedule;
  if (dto.vacancyRiskLevel !== undefined) updateData.vacancyRiskLevel = dto.vacancyRiskLevel;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.notes !== undefined) updateData.notes = dto.notes;
  if (dto.formData !== undefined) updateData.formData = dto.formData as Prisma.InputJsonValue;
  return updateData;
}

// Add more contract-related helpers here as needed.
