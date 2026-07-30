import { Injectable } from '@nestjs/common';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import {
  notificationForAdmin,
  notificationForInvestor,
  updateNotificationForAdmin,
  updateNotificationForInvestor,
  deletionNotificationForAdmin,
  deletionNotificationForInvestor,
  generalUpdateNotificationForAdmin,
  generalUpdateNotificationForInvestor,
} from '../contract.config';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Injectable()
export class ContractsNotificationsService {
  constructor(private readonly notifications: NotificationsService) {}

  private isStaff(user: CurrentUser): boolean {
    return user.role === 'admin' || user.role === 'superadmin';
  }

  /**
   * Handles notifications for new contract creation.
   */
  async notifyNewContract(
    currentUserId: string,
    investorId: string,
    contractId: string,
    propertyId: string,
    status?: string,
  ): Promise<void> {
    // Don't notify admins for draft contracts
    if (status === 'draft') {
      return;
    }

    // structured ids included in json payload so admin UI can build the correct route
    const json = { investorId, propertyId, contractId };
    const copy =
      currentUserId === investorId ? notificationForAdmin : notificationForInvestor;

    await this.notifications.notifyAdmins({
      ...copy,
      type: NotificationType.contract,
      link: `/${contractId}`,
      json,
    });
  }

  /**
   * Handles notifications for contract status changes.
   */
  async notifyStatusChange(
    currentUser: CurrentUser,
    contractId: string,
    propertyId: string,
    investorId: string,
    newStatus: string,
  ): Promise<void> {
    await this.notifyBothSides(currentUser, investorId, `/${contractId}`, {
      investorId,
      propertyId,
      contractId,
    }, updateNotificationForInvestor, updateNotificationForAdmin);
  }

  /**
   * Handles notifications for contract deletion.
   */
  async notifyDeletion(
    currentUser: CurrentUser,
    contractId: string,
    propertyId: string,
    investorId: string,
  ): Promise<void> {
    await this.notifyBothSides(currentUser, investorId, '/contracts', {
      investorId,
      propertyId,
      contractId,
    }, deletionNotificationForInvestor, deletionNotificationForAdmin);
  }

  /**
   * Handles notifications for general contract updates (non-status changes).
   */
  async notifyGeneralUpdate(
    currentUser: CurrentUser,
    contractId: string,
    propertyId: string,
    investorId: string,
  ): Promise<void> {
    await this.notifyBothSides(currentUser, investorId, `/${contractId}`, {
      investorId,
      propertyId,
      contractId,
    }, generalUpdateNotificationForInvestor, generalUpdateNotificationForAdmin);
  }

  /**
   * Contract changes are always "one side acted, tell the other side" — staff
   * edits notify the investor, investor/broker edits notify staff.
   */
  private async notifyBothSides(
    currentUser: CurrentUser,
    investorId: string,
    link: string,
    json: Record<string, unknown>,
    copyForInvestor: { title: string; message: string },
    copyForAdmin: { title: string; message: string },
  ): Promise<void> {
    if (this.isStaff(currentUser)) {
      await this.notifications.notifyUser(investorId, {
        ...copyForInvestor,
        type: NotificationType.contract,
        link,
        json,
      });
    } else {
      await this.notifications.notifyAdmins({
        ...copyForAdmin,
        type: NotificationType.contract,
        link,
        json,
      });
    }
  }
}
