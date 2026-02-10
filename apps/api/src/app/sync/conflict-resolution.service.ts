import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictResolutionStrategy } from '@simple-pos/shared/types';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ConflictResolutionService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    tenantId: string,
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    mergedData?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.withRls(tenantId, async (tx) => {
      const conflict = await tx.syncConflict.findFirst({
        where: {
          id: conflictId,
          tenantId,
          resolved: false,
        },
      });

      if (!conflict) {
        throw new NotFoundException('Conflict not found or already resolved');
      }

      const document = await tx.syncDocument.findFirst({
        where: {
          tenantId,
          entity: conflict.entity,
          cloudId: conflict.cloudId,
        },
      });

      const serverData = this.asRecord(conflict.serverData);
      const clientData = this.asRecord(conflict.clientData);

      const resolvedPayload = this.resolvePayload(
        strategy,
        serverData,
        clientData,
        mergedData,
        document?.data,
      );

      if (document && strategy !== 'SERVER_WINS') {
        await tx.syncDocument.update({
          where: { id: document.id },
          data: {
            data: this.toInputJsonValue(resolvedPayload),
            version: document.version + 1,
            syncedAt: new Date(),
            lastModifiedAt: new Date(),
          },
        });
      }

      await tx.syncConflict.update({
        where: { id: conflict.id },
        data: {
          strategy,
          resolved: true,
          resolvedAt: new Date(),
        },
      });
    });
  }

  private resolvePayload(
    strategy: ConflictResolutionStrategy,
    serverData: Record<string, unknown>,
    clientData: Record<string, unknown>,
    mergedData: Record<string, unknown> | undefined,
    currentData: unknown,
  ): Record<string, unknown> {
    switch (strategy) {
      case 'SERVER_WINS':
        return serverData;
      case 'CLIENT_WINS':
        return clientData;
      case 'LAST_WRITE_WINS': {
        const serverTs = this.parseTime(serverData['lastModifiedAt']);
        const clientTs = this.parseTime(clientData['lastModifiedAt']);
        return clientTs >= serverTs ? clientData : serverData;
      }
      case 'MERGE':
      case 'MANUAL': {
        if (mergedData && Object.keys(mergedData).length > 0) {
          return mergedData;
        }
        if (this.isRecord(currentData) && Object.keys(currentData).length > 0) {
          return currentData;
        }
        return clientData;
      }
      default:
        return serverData;
    }
  }

  private parseTime(value: unknown): number {
    if (typeof value !== 'string') {
      return 0;
    }
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? 0 : ts;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (this.isRecord(value)) {
      return value;
    }
    return {};
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private toInputJsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonObject;
  }
}
