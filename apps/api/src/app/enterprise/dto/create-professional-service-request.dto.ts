export interface ProfessionalServicePreferredContactDto {
  method?: 'EMAIL' | 'PHONE' | 'VIDEO_CALL';
  email?: string;
  phone?: string;
  timezone?: string;
  availability?: string;
}

export class CreateProfessionalServiceRequestDto {
  category!: string;
  priority?: string;
  title!: string;
  description!: string;
  preferredContact?: ProfessionalServicePreferredContactDto;
}
