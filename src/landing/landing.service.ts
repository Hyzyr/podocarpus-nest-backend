import { Injectable, NotFoundException } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import {
  CreateSuccessCaseDto,
  LandingEventDto,
  LandingEventStatDto,
  LandingPropertyDto,
  LandingQueryDto,
  LandingResponseDto,
  LandingStatsDto,
  LandingSuccessCaseDto,
  SuccessCasePropertyDto,
  UpdateLandingStatsDto,
  UpdateSuccessCaseDto,
} from './dto/landing.dto';

const LANDING_STATS_ID = 'default';
const DEFAULT_PROPERTIES_LIMIT = 4;
const DEFAULT_EVENTS_LIMIT = 4;
const DEFAULT_CASES_LIMIT = 3;
const MAX_LANDING_LIMIT = 8;

@Injectable()
export class LandingService {
  constructor(private readonly prisma: PrismaService) {}

  async getLanding(query: LandingQueryDto): Promise<LandingResponseDto> {
    const propertiesLimit = this.normalizeLimit(
      query.propertiesLimit,
      DEFAULT_PROPERTIES_LIMIT,
    );
    const eventsLimit = this.normalizeLimit(
      query.eventsLimit,
      DEFAULT_EVENTS_LIMIT,
    );
    const casesLimit = this.normalizeLimit(
      query.casesLimit,
      DEFAULT_CASES_LIMIT,
    );

    const [stats, properties, events, successCases] = await Promise.all([
      this.getPublicStats(),
      this.getPublicProperties(propertiesLimit),
      this.getPublicEvents(eventsLimit),
      this.getPublicSuccessCases(casesLimit),
    ]);

    return { stats, properties, events, successCases };
  }

  async getPublicStats(): Promise<LandingStatsDto> {
    const [settings, calculated] = await Promise.all([
      this.prisma.landingPageStats.findUnique({
        where: { id: LANDING_STATS_ID },
      }),
      this.calculateStats(),
    ]);

    return {
      yearsOperating: settings?.yearsOperating ?? calculated.yearsOperating,
      maxLeaseTermYears:
        settings?.maxLeaseTermYears ?? calculated.maxLeaseTermYears,
      totalProperties: settings?.totalProperties ?? calculated.totalProperties,
      availableProperties:
        settings?.availableProperties ?? calculated.availableProperties,
      averageRoi: settings?.averageRoi ?? calculated.averageRoi,
      roiMin: settings?.roiMin ?? calculated.roiMin,
      roiMax: settings?.roiMax ?? calculated.roiMax,
      totalInvestedValue:
        settings?.totalInvestedValue ?? calculated.totalInvestedValue,
      totalProfit: settings?.totalProfit ?? calculated.totalProfit,
      activeContracts: settings?.activeContracts ?? calculated.activeContracts,
      occupancyRate: settings?.occupancyRate ?? calculated.occupancyRate,
      generatedAt: new Date(),
    };
  }

  async getPublicProperties(
    limit = DEFAULT_PROPERTIES_LIMIT,
  ): Promise<LandingPropertyDto[]> {
    const take = this.normalizeLimit(limit, DEFAULT_PROPERTIES_LIMIT);
    const properties = await this.prisma.property.findMany({
      where: {
        ownerId: null,
        isEnabled: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        area: true,
        buildingName: true,
        city: true,
        country: true,
        contractValue: true,
        netRoiMin: true,
        netRoiMax: true,
        isTaxFreeZone: true,
        isVacant: true,
        vacancyRisk: true,
        keyBenefits: true,
        images: true,
        statusLabel: true,
        status: true,
        featuredRank: true,
      },
      orderBy: [{ featuredRank: 'asc' }, { createdAt: 'desc' }],
      take,
    });

    return properties.map((property) => ({
      id: property.id,
      title: property.title,
      description: property.description,
      area: property.area,
      buildingName: property.buildingName,
      city: property.city,
      country: property.country,
      contractValue: property.contractValue,
      netRoiMin: property.netRoiMin,
      netRoiMax: property.netRoiMax,
      isTaxFreeZone: property.isTaxFreeZone,
      isVacant: property.isVacant,
      vacancyRisk: property.vacancyRisk,
      keyBenefits: property.keyBenefits,
      image: property.images?.[0] ?? null,
      statusLabel: property.statusLabel ?? this.toStatusLabel(property.status),
      featuredRank: property.featuredRank,
    }));
  }

  async getPublicEvents(
    limit = DEFAULT_EVENTS_LIMIT,
  ): Promise<LandingEventDto[]> {
    const take = this.normalizeLimit(limit, DEFAULT_EVENTS_LIMIT);
    const events = await this.prisma.event.findMany({
      where: {
        isActive: true,
        status: { in: [EventStatus.OPEN, EventStatus.UPCOMING] },
        startsAt: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        startsAt: true,
        endsAt: true,
        location: true,
        totalMembers: true,
        status: true,
        image: true,
        stats: true,
      },
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
      take,
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      subtitle: event.subtitle,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      totalMembers: event.totalMembers,
      status: event.status,
      image: event.image,
      stats: this.mapEventStats(event.stats),
    }));
  }

  async getPublicSuccessCases(
    limit = DEFAULT_CASES_LIMIT,
  ): Promise<LandingSuccessCaseDto[]> {
    const take = this.normalizeLimit(limit, DEFAULT_CASES_LIMIT);
    const successCases = await this.prisma.successCase.findMany({
      where: { isPublished: true, hasConsent: true },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            status: true,
            buildingName: true,
            area: true,
            city: true,
            country: true,
            images: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take,
    });

    return successCases.map((successCase) => ({
      id: successCase.id,
      quote: successCase.quote,
      investorName: successCase.investorName,
      investorTitle: successCase.investorTitle,
      avatarUrl: successCase.avatarUrl,
      totalProfit: successCase.totalProfit,
      totalRoi: successCase.totalRoi,
      property: this.mapSuccessCaseProperty(successCase),
    }));
  }

  async getStatsSettings() {
    const existing = await this.prisma.landingPageStats.findUnique({
      where: { id: LANDING_STATS_ID },
    });

    if (existing) return existing;

    return this.prisma.landingPageStats.create({
      data: { id: LANDING_STATS_ID },
    });
  }

  async updateStatsSettings(dto: UpdateLandingStatsDto) {
    return this.prisma.landingPageStats.upsert({
      where: { id: LANDING_STATS_ID },
      create: { id: LANDING_STATS_ID, ...dto },
      update: dto,
    });
  }

  async getAdminSuccessCases() {
    return this.prisma.successCase.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createSuccessCase(dto: CreateSuccessCaseDto) {
    const { publishedAt, propertySnapshot, ...rest } = dto;
    const data: Prisma.SuccessCaseUncheckedCreateInput = {
      ...rest,
      publishedAt: this.toDateOrNull(publishedAt),
      propertySnapshot: this.toInputJsonOrNull(propertySnapshot),
    };

    return this.prisma.successCase.create({
      data,
    });
  }

  async updateSuccessCase(id: string, dto: UpdateSuccessCaseDto) {
    await this.assertSuccessCaseExists(id);

    const { publishedAt, propertySnapshot, ...rest } = dto;
    const data: Prisma.SuccessCaseUncheckedUpdateInput = {
      ...rest,
      ...(publishedAt !== undefined && {
        publishedAt: this.toDateOrNull(publishedAt),
      }),
      ...(propertySnapshot !== undefined && {
        propertySnapshot: this.toInputJsonOrNull(propertySnapshot),
      }),
    };

    return this.prisma.successCase.update({
      where: { id },
      data,
    });
  }

  async deleteSuccessCase(id: string) {
    await this.assertSuccessCaseExists(id);
    return this.prisma.successCase.delete({ where: { id } });
  }

  private async calculateStats(): Promise<
    Omit<LandingStatsDto, 'generatedAt'>
  > {
    const [
      totalProperties,
      availableProperties,
      occupiedProperties,
      earliestProperty,
      propertyRoi,
      investmentRoi,
      contractValues,
      profit,
      activeContracts,
    ] = await Promise.all([
      this.prisma.property.count({ where: { isEnabled: true } }),
      this.prisma.property.count({ where: { isEnabled: true, ownerId: null } }),
      this.prisma.property.count({
        where: { isEnabled: true, isVacant: false },
      }),
      this.prisma.property.findFirst({
        where: { isEnabled: true },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      this.prisma.property.aggregate({
        where: { isEnabled: true },
        _avg: { netRoiMin: true, netRoiMax: true },
        _min: { netRoiMin: true },
        _max: { netRoiMax: true },
      }),
      this.prisma.investmentStatistics.aggregate({
        _avg: { roiPercentage: true },
      }),
      this.prisma.contract.aggregate({
        where: {
          status: { in: ['active', 'pending'] },
          contractValue: { not: null },
        },
        _sum: { contractValue: true },
      }),
      this.prisma.investmentStatistics.aggregate({
        _sum: { netProfit: true },
      }),
      this.prisma.contract.count({ where: { status: 'active' } }),
    ]);

    const propertyAverageRoi = this.averageNullableNumbers([
      propertyRoi._avg.netRoiMin,
      propertyRoi._avg.netRoiMax,
    ]);
    const occupancyRate =
      totalProperties > 0
        ? Math.round((occupiedProperties / totalProperties) * 100)
        : 0;

    return {
      yearsOperating: this.calculateYearsOperating(earliestProperty?.createdAt),
      maxLeaseTermYears: null,
      totalProperties,
      availableProperties,
      averageRoi: this.roundOneDecimal(
        investmentRoi._avg.roiPercentage ?? propertyAverageRoi ?? 0,
      ),
      roiMin: propertyRoi._min.netRoiMin ?? null,
      roiMax: propertyRoi._max.netRoiMax ?? null,
      totalInvestedValue: contractValues._sum.contractValue ?? 0,
      totalProfit: profit._sum.netProfit ?? 0,
      activeContracts,
      occupancyRate,
    };
  }

  private normalizeLimit(value: number | undefined, fallback: number) {
    const limit = value ?? fallback;
    if (!Number.isFinite(limit)) return fallback;
    return Math.min(Math.max(Math.trunc(limit), 0), MAX_LANDING_LIMIT);
  }

  private mapEventStats(stats: Prisma.JsonValue): LandingEventStatDto[] {
    if (!Array.isArray(stats)) return [];

    const mappedStats: LandingEventStatDto[] = [];

    for (const item of stats) {
      const record = this.toRecord(item);
      const title = this.toOptionalString(record?.title);
      if (!title) continue;

      mappedStats.push({
        title,
        info: this.toOptionalString(record?.info),
      });

      if (mappedStats.length === 2) break;
    }

    return mappedStats;
  }

  private mapSuccessCaseProperty(successCase: {
    propertySnapshot: Prisma.JsonValue | null;
    property: {
      id: string;
      title: string;
      status: string | null;
      buildingName: string | null;
      area: string | null;
      city: string | null;
      country: string | null;
      images: string[];
      createdAt: Date;
    } | null;
  }): SuccessCasePropertyDto | null {
    const snapshot = this.toRecord(successCase.propertySnapshot);
    if (snapshot) {
      const location = this.toRecord(snapshot.location);

      return {
        id: this.toOptionalString(snapshot.id),
        title: this.toOptionalString(snapshot.title),
        type: this.toOptionalString(snapshot.type),
        imageUrl: this.toOptionalString(snapshot.imageUrl),
        year: this.toOptionalNumber(snapshot.year),
        location: location
          ? {
              line1: this.toOptionalString(location.line1),
              city: this.toOptionalString(location.city),
              country: this.toOptionalString(location.country),
            }
          : null,
      };
    }

    const property = successCase.property;
    if (!property) return null;

    return {
      id: property.id,
      title: property.title,
      type: property.status,
      imageUrl: property.images?.[0] ?? null,
      year: property.createdAt.getFullYear(),
      location: {
        line1: property.area ?? property.buildingName,
        city: property.city,
        country: property.country,
      },
    };
  }

  private toStatusLabel(status?: string | null) {
    if (!status) return null;
    return status
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private calculateYearsOperating(firstDate?: Date) {
    if (!firstDate) return 0;
    return Math.max(0, new Date().getFullYear() - firstDate.getFullYear() + 1);
  }

  private averageNullableNumbers(values: Array<number | null | undefined>) {
    const validValues = values.filter(
      (value): value is number => typeof value === 'number',
    );
    if (validValues.length === 0) return null;
    return (
      validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    );
  }

  private roundOneDecimal(value: number) {
    return Math.round(value * 10) / 10;
  }

  private toDateOrNull(value: string | Date | null | undefined) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return new Date(value);
  }

  private toInputJsonOrNull(
    value: Record<string, unknown> | null | undefined,
  ): Prisma.InputJsonObject | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) return undefined;
    if (value === null) return Prisma.DbNull;
    return this.toInputJsonObject(value);
  }

  private toInputJsonObject(
    value: Record<string, unknown>,
  ): Prisma.InputJsonObject {
    const jsonObject: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, rawValue] of Object.entries(value)) {
      const jsonValue = this.toInputJsonValue(rawValue);
      if (jsonValue !== undefined) jsonObject[key] = jsonValue;
    }

    return jsonObject as Prisma.InputJsonObject;
  }

  private toInputJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) {
      return value
        .map((item) => this.toInputJsonValue(item))
        .filter(
          (item): item is Prisma.InputJsonValue | null => item !== undefined,
        );
    }
    if (typeof value === 'object') {
      return this.toInputJsonObject(value as Record<string, unknown>);
    }

    return undefined;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return null;
    return value as Record<string, unknown>;
  }

  private toOptionalString(value: unknown) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    if (value instanceof Date) return value.toISOString();
    return null;
  }

  private toOptionalNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private async assertSuccessCaseExists(id: string) {
    const existing = await this.prisma.successCase.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException(`Success case ${id} not found`);
  }
}
