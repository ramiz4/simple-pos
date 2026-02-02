/**
 * Base repository interface defining CRUD operations.
 * All repositories must implement this interface.
 */
export interface BaseRepository<T> {
  /**
   * Find an entity by its ID
   */
  findById(id: number): Promise<T | null>;

  /**
   * Find all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Create a new entity
   */
  create(entity: Omit<T, 'id'>): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: number, entity: Partial<T>): Promise<T>;

  /**
   * Delete an entity by its ID
   */
  delete(id: number): Promise<void>;

  /**
   * Count total entities
   */
  count(): Promise<number>;
}
