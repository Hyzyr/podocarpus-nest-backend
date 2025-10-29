import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import {
  notificationForAdmin,
  notificationForInvestor,
  updateNotificationForAdmin,
  updateNotificationForInvestor,
} from '../contract.config';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Injectable()
export class ContractsNotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Handles notifications for new contract creation.
   */
  async notifyNewContract(
    currentUserId: string,
    investorId: string,
    contractId: string,
    propertyId: string,
  ): Promise<void> {
    // structured ids included in json payload so admin UI can build the correct route
    const jsonPayload = { investorId, propertyId, contractId };

    if (currentUserId === investorId)
      await this.notifications.notifyByRole('admin', 'contract', {
        ...notificationForAdmin,
        link: `/${investorId}`,
        json: jsonPayload,
      });
    else
      await this.notifications.notifyByRole('admin', 'contract', {
        ...notificationForInvestor,
        link: `/${investorId}`,
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
      await this.notifications.notifyByRole('admin', 'contract', {
        ...updateNotificationForAdmin,
        link: `/${contractId}`,
        json: jsonPayload,
      });
    }
  }
}