import { Injectable, signal } from '@angular/core';
import { BaseRepository } from '../../core/interfaces/base-repository.interface';
import { TestEntity } from '../../domain/entities/test-entity.interface';
import { RepositoryFactory } from '../../infrastructure/adapters/repository.factory';

/**
 * Service for testing and demonstrating the persistence layer
 */
@Injectable({
  providedIn: 'root',
})
export class TestService {
  private repository: BaseRepository<TestEntity>;

  // Signals for reactive UI updates
  entities = signal<TestEntity[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private repositoryFactory: RepositoryFactory) {
    this.repository = this.repositoryFactory.getTestRepository();
    this.loadAll();
  }

  async loadAll(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const data = await this.repository.findAll();
      this.entities.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load entities');
      console.error('Error loading entities:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createTestEntity(name: string, value: string | null): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      await this.repository.create({ name, value, createdAt: new Date().toISOString() });
      await this.loadAll();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to create entity');
      console.error('Error creating entity:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTestEntity(id: number, name: string, value: string | null): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      await this.repository.update(id, { name, value });
      await this.loadAll();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to update entity');
      console.error('Error updating entity:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteTestEntity(id: number): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      await this.repository.delete(id);
      await this.loadAll();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to delete entity');
      console.error('Error deleting entity:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.repository.count();
    } catch (err) {
      console.error('Error counting entities:', err);
      return 0;
    }
  }
}
