import { createCampaignSchema } from './create-campaign.dto.js';

export const updateCampaignSchema = createCampaignSchema.partial();

export type UpdateCampaignDto = Partial<
  import('./create-campaign.dto.js').CreateCampaignDto
>;
