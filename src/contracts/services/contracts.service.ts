import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  UpdateContractDto,
  CreateContractWithFormDataDto,
  StoreDraftDto,
  UpdateDraftDto,
  PublishContractDto,
  AdminUpdateContractDto,
} from '../dto/contract.dto';
import { ContractFormDataSchema } from '../dto/contract-form.dto';
import { PropertiesService } from 'src/properties/services/properties.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { ContractsNotificationsService } from './contracts.notifications.service';
import { Prisma } from '@prisma/client';
import { buildContractUpdateData, buildContractCreateData } from '../contracts.helper';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly property: PropertiesService,
    private readonly contractsNotifications: ContractsNotificationsService,
  ) {}

  async createContract(currentUserId: string, dto: CreateContractWithFormDataDto) {
    const propertyId = dto.propertyId;
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property)
      throw new NotFoundException(`Property ${propertyId} not found`);

    // Validate formData if provided using the new structure
    if (dto.formData) {
      const validation = ContractFormDataSchema.safeParse(dto.formData);
      if (!validation.success) {
        console.error('Contract form validation failed:', {
          formData: dto.formData,
          errors: validation.error.issues,
        });
        throw new BadRequestException(
          `Invalid form data: ${validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        );
      }
    }

    const contract = await this.prisma.contract.create({
      data: buildContractCreateData(dto),
    });

    this.logger.log(`Created new contract ${contract.id} for property ${propertyId} by user ${currentUserId}`);

    await this.contractsNotifications.notifyNewContract(
      currentUserId,
      contract.investorId,
      contract.id,
      propertyId,
      contract.status,
    );

    return contract;
  }
  
  async getAll(userId: string) {
    return this.prisma.contract.findMany({
      where: { investorId: userId },
      include: { property: true },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        property: true,
        investor: {
          include: { user: true },
        },
      },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return contract;
  }
  
  /**
   * Admin Update - Only for administrative fields
   * Admins/Agents CANNOT edit formData (legal investor data)
   * They CAN edit: status, brokerId, notes, dates, values, payment info
   */
  async adminUpdate(currentUser: CurrentUser, id: string, dto: AdminUpdateContractDto) {
    this.logger.log(`Admin updating contract ${id} by user ${currentUser.userId} (${currentUser.role})`);
    
    // 1. Fetch the existing contract
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      this.logger.warn(`Contract ${id} not found for admin update`);
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // 2. Build admin update data (explicitly exclude formData)
    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.brokerId !== undefined) updateData.brokerId = dto.brokerId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.contractStart !== undefined) updateData.contractStart = dto.contractStart;
    if (dto.contractEnd !== undefined) updateData.contractEnd = dto.contractEnd;
    if (dto.contractValue !== undefined) updateData.contractValue = dto.contractValue;
    if (dto.depositPaid !== undefined) updateData.depositPaid = dto.depositPaid;
    if (dto.investorPaymentMethod !== undefined) updateData.investorPaymentMethod = dto.investorPaymentMethod;
    if (dto.paymentSchedule !== undefined) updateData.paymentSchedule = dto.paymentSchedule;
    if (dto.vacancyRiskLevel !== undefined) updateData.vacancyRiskLevel = dto.vacancyRiskLevel;
    if (dto.fileUrl !== undefined) updateData.fileUrl = dto.fileUrl;
    if (dto.signedDate !== undefined) updateData.signedDate = dto.signedDate;

    this.logger.log(`Admin update fields: ${Object.keys(updateData).join(', ')}`);

    // 3. Update the contract in the database
    const newContract = await this.prisma.contract.update({
      where: { id },
      data: updateData,
    });

    // 4. Handle notifications and property ownership if status changed
    if (existing.status !== newContract.status) {
      this.logger.log(`Contract ${id} status changed: ${existing.status} → ${newContract.status}`);
      
      if (newContract.status === 'active') {
        // If status changed to 'active', assign property owner
        await this.property.assignOwner(existing.propertyId, existing.investorId);
      } else if (newContract.status !== 'suspended') {
        // If status changed to anything except 'active' or 'suspended', remove owner
        await this.property.assignOwner(existing.propertyId, null);
      }

      // Notify about status change
      await this.contractsNotifications.notifyStatusChange(
        currentUser,
        existing.id,
        existing.propertyId,
        existing.investorId,
        newContract.status,
      );
    } else {
      // If only other fields changed, send a general update notification
      await this.contractsNotifications.notifyGeneralUpdate(
        currentUser,
        existing.id,
        existing.propertyId,
        existing.investorId,
      );
    }

    // 5. Return the updated contract
    return newContract;
  }

  // ============================================================================
  // Draft Management Methods
  // ============================================================================

  /**
   * Store a new contract as draft with minimal validation
   * Investors can create drafts for their own properties
   */
  async storeDraft(currentUserId: string, dto: StoreDraftDto) {
    // 1. Validate property exists
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) {
      throw new NotFoundException(`Property ${dto.propertyId} not found`);
    }

    // 2. Validate investor exists
    const investor = await this.prisma.investorProfile.findUnique({
      where: { userId: dto.investorId },
    });
    if (!investor) {
      throw new NotFoundException(`Investor ${dto.investorId} not found`);
    }

    // 3. Create draft contract (no strict validation on formData)
    const contract = await this.prisma.contract.create({
      data: {
        property: { connect: { id: dto.propertyId } },
        investor: { connect: { userId: dto.investorId } },
        ...(dto.brokerId && { broker: { connect: { userId: dto.brokerId } } }),
        filesUrl: dto.filesUrl || [],
        formData: dto.formData as Prisma.InputJsonValue,
        notes: dto.notes,
        status: 'draft', // Always set status to draft
      },
    });

    return contract;
  }

  /**
   * Update an existing draft contract
   * Only allows updates if status is 'draft'
   */
  async updateDraft(currentUser: CurrentUser, id: string, dto: UpdateDraftDto) {
    // 1. Fetch existing contract
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // 2. Ensure contract is still a draft
    if (existing.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update contract with status '${existing.status}'. Only drafts can be updated with this endpoint.`
      );
    }

    // 3. Check permissions: investor can only update their own drafts
    if (currentUser.role === 'investor' && existing.investorId !== currentUser.userId) {
      throw new ForbiddenException('You can only update your own draft contracts');
    }

    // 4. Merge formData if provided (deep merge)
    let mergedFormData = existing.formData as any;
    if (dto.formData) {
      mergedFormData = {
        ...(existing.formData as object || {}),
        ...dto.formData,
      };
    }

    // 5. Build update data
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
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.formData !== undefined) updateData.formData = mergedFormData as Prisma.InputJsonValue;

    // 6. Update the draft
    const updatedContract = await this.prisma.contract.update({
      where: { id },
      data: updateData,
    });

    return updatedContract;
  }

  /**
   * Publish a draft contract (change status from draft to pending)
   * Requires full validation of formData
   * Investors can publish their own drafts
   */
  async publishContract(currentUser: CurrentUser, id: string, dto?: PublishContractDto) {
    // 1. Fetch existing contract
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // 2. Ensure contract is a draft
    if (existing.status !== 'draft') {
      throw new BadRequestException(
        `Contract is already published with status '${existing.status}'`
      );
    }

    // 3. Check permissions: investor can only publish their own drafts
    if (currentUser.role === 'investor' && existing.investorId !== currentUser.userId) {
      throw new ForbiddenException('You can only publish your own draft contracts');
    }

    // 4. Merge any additional data provided
    let finalFormData = existing.formData as any;
    let finalFilesUrl = existing.filesUrl;

    if (dto?.formData) {
      finalFormData = {
        ...(existing.formData as object || {}),
        ...dto.formData,
      };
    }

    if (dto?.filesUrl) {
      finalFilesUrl = [...(existing.filesUrl || []), ...(dto.filesUrl || [])];
    }

    // 5. Run full validation on formData
    if (finalFormData) {
      const validation = ContractFormDataSchema.safeParse(finalFormData);
      if (!validation.success) {
        console.error('Contract form validation failed on publish:', {
          formData: finalFormData,
          errors: validation.error.issues,
        });
        throw new BadRequestException(
          `Cannot publish: Invalid form data. ${validation.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
    }

    // 6. Update contract to pending status
    const publishedContract = await this.prisma.contract.update({
      where: { id },
      data: {
        status: 'pending',
        formData: finalFormData as Prisma.InputJsonValue,
        filesUrl: finalFilesUrl,
      },
    });

    this.logger.log(`Contract ${id} published (draft -> pending) by user ${currentUser.userId}`);

    // 7. Notify admins about the new pending contract
    await this.contractsNotifications.notifyNewContract(
      currentUser.userId,
      publishedContract.investorId,
      publishedContract.id,
      publishedContract.propertyId,
      publishedContract.status,
    );

    return publishedContract;
  }

  ///
  ///
  // Admin only
  async findAll() {
    return this.prisma.contract.findMany({
      where: {
        status: { not: 'draft' },
      },
      include: {
        property: true,
        investor: {
          include: { user: true },
        },
      },
    });
  }

  async remove(currentUser: CurrentUser, id: string) {
    this.logger.log(`Attempting to remove contract ${id} by user ${currentUser.userId} (${currentUser.role})`);
    
    const existing = await this.prisma.contract.findUnique({ where: { id } });
    if (!existing) {
      this.logger.warn(`Contract ${id} not found for removal`);
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // RBAC and Status check for deletion
    if (currentUser.role === 'investor') {
      // 1. Must be their own contract
      if (existing.investorId !== currentUser.userId) {
        this.logger.warn(`User ${currentUser.userId} attempted to delete contract ${id} owned by ${existing.investorId}`);
        throw new ForbiddenException('You can only delete your own contracts');
      }
      // 2. Only draft or pending status
      if (!['draft', 'pending'].includes(existing.status)) {
        this.logger.warn(`Investor ${currentUser.userId} attempted to delete contract ${id} in status ${existing.status}`);
        throw new ForbiddenException(
          `Cannot delete contract with status '${existing.status}'. Only draft or pending contracts can be deleted by investors.`
        );
      }
    }

    this.logger.log(`Contract ${id} (status: ${existing.status}) is being deleted by ${currentUser.role} ${currentUser.userId}`);

    // Send notification before deleting
    await this.contractsNotifications.notifyDeletion(
      currentUser,
      existing.id,
      existing.propertyId,
      existing.investorId,
    );

    const result = await this.prisma.contract.delete({ where: { id } });
    this.logger.log(`Contract ${id} successfully deleted`);
    return result;
  }

}
