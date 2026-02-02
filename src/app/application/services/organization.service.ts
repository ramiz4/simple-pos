import { Injectable } from '@angular/core';
import { PlatformService } from '../../shared/utilities/platform.service';
import { SQLiteOrganizationRepository } from '../../infrastructure/repositories/sqlite-organization.repository';
import { IndexedDBOrganizationRepository } from '../../infrastructure/repositories/indexeddb-organization.repository';
import { Organization } from '../../domain/entities/organization.interface';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  constructor(
    private platformService: PlatformService,
    private sqliteOrgRepo: SQLiteOrganizationRepository,
    private indexedDBOrgRepo: IndexedDBOrganizationRepository
  ) {}

  async createOrganization(
    name: string,
    email: string
  ): Promise<Organization> {
    const orgRepo = this.getOrgRepo();

    // Check if organization with email already exists
    const existing = await orgRepo.findByEmail(email);
    if (existing) {
      throw new Error('An organization is already registered with this email address. Please use a different email or contact support if you believe this is an error.');
    }

    return await orgRepo.create({
      name,
      email,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  async getOrganizationById(id: number): Promise<Organization | null> {
    const orgRepo = this.getOrgRepo();
    return await orgRepo.findById(id);
  }

  async getOrganizationByEmail(email: string): Promise<Organization | null> {
    const orgRepo = this.getOrgRepo();
    return await orgRepo.findByEmail(email);
  }

  async getAllOrganizations(): Promise<Organization[]> {
    const orgRepo = this.getOrgRepo();
    return await orgRepo.findAll();
  }

  async updateOrganization(
    id: number,
    updates: Partial<Organization>
  ): Promise<Organization> {
    const orgRepo = this.getOrgRepo();
    return await orgRepo.update(id, updates);
  }

  async deleteOrganization(id: number): Promise<void> {
    const orgRepo = this.getOrgRepo();
    await orgRepo.delete(id);
  }

  private getOrgRepo() {
    return this.platformService.isTauri()
      ? this.sqliteOrgRepo
      : this.indexedDBOrgRepo;
  }
}
