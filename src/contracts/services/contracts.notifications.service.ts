import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { NotificationsService } from 'src/shared/notifications/notifications.service';
import { GlobalNotificationsService } from 'src/shared/global-notifications/global-notifications.service';
import { NotificationType, UserRole } from '@prisma/client';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly globalNotifications: GlobalNotificationsService,
  ) {}

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
    const jsonPayload = { investorId, propertyId, contractId };

    if (currentUserId === investorId)
      await this.globalNotifications.create({
        ...notificationForAdmin,
        type: NotificationType.contract,
        targetRoles: [UserRole.admin, UserRole.superadmin],
        link: `/${contractId}`,
        json: jsonPayload,
      });
    else
      await this.globalNotifications.create({
        ...notificationForInvestor,
        type: NotificationType.contract,
        targetRoles: [UserRole.admin, UserRole.superadmin],
        link: `/${contractId}`,
        json: jsonPayload,
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
    const jsonPayload = { investorId, propertyId, contractId };
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

    if (isAdmin) {
      // admin updated, notify investor
      await this.notifications.notify(investorId, 'contract', {
        ...updateNotificationForInvestor,
        link: `/${contractId}`,
        json: jsonPayload,
      });
    } else {
      // investor/broker updated, notify admin
      await this.globalNotifications.create({
        ...updateNotificationForAdmin,
        type: NotificationType.contract,
        targetRoles: [UserRole.admin, UserRole.superadmin],
        link: `/${contractId}`,
        json: jsonPayload,
      });
    }
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
    const jsonPayload = { investorId, propertyId, contractId };
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

    if (isAdmin) {
      // admin deleted, notify investor
      await this.notifications.notify(investorId, 'contract', {
        ...deletionNotificationForInvestor,
        link: `/contracts`,
        json: jsonPayload,
      });
    } else {
      // investor deleted (if they have permission), notify admin
      await this.globalNotifications.create({
        ...deletionNotificationForAdmin,
        type: NotificationType.contract,
        targetRoles: [UserRole.admin, UserRole.superadmin],
        link: `/contracts`,
        json: jsonPayload,
      });
    }
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
    const jsonPayload = { investorId, propertyId, contractId };
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

    if (isAdmin) {
      // admin updated, notify investor
      await this.notifications.notify(investorId, 'contract', {
        ...generalUpdateNotificationForInvestor,
        link: `/${contractId}`,
        json: jsonPayload,
      });
    } else {
      // investor/broker updated, notify admin
      await this.globalNotifications.create({
        ...generalUpdateNotificationForAdmin,
        type: NotificationType.contract,
        targetRoles: [UserRole.admin, UserRole.superadmin],
        link: `/${contractId}`,
        json: jsonPayload,
      });
    }
  }
}