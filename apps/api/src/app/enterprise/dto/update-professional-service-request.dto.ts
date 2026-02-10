export class UpdateProfessionalServiceRequestDto {
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  internalNotes?: Record<string, unknown> | null;
}
