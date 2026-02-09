/**
 * Test entity for validating persistence layer
 */
export interface TestEntity {
  id: number;
  name: string;
  value: string | null;
  createdAt: string;
}
