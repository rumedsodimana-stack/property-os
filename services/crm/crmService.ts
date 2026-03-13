import { addItem, updateItem, fetchItems, fetchItem } from "../kernel/firestoreService";
import { Campaign, CrmTask, GuestProfile, Segment, Interaction, Contact, CompanyAccount } from "../../types/crm";

export const crmService = {
    async listProfiles(): Promise<GuestProfile[]> {
        return fetchItems<GuestProfile>('crm_profiles');
    },
    async upsertProfile(profile: GuestProfile): Promise<void> {
        await updateItem('crm_profiles', profile.id, profile);
    },
    async mergeProfile(sourceId: string, targetId: string): Promise<void> {
        await updateItem('crm_profiles', sourceId, { mergedIntoId: targetId, updatedAt: new Date().toISOString() });
    },

    async listSegments(): Promise<Segment[]> {
        return fetchItems<Segment>('crm_segments');
    },
    async upsertSegment(segment: Segment): Promise<void> {
        await updateItem('crm_segments', segment.id, segment);
    },

    async listCampaigns(): Promise<Campaign[]> {
        return fetchItems<Campaign>('crm_campaigns');
    },
    async upsertCampaign(campaign: Campaign): Promise<void> {
        await updateItem('crm_campaigns', campaign.id, campaign);
    },

    async listTasks(): Promise<CrmTask[]> {
        return fetchItems<CrmTask>('crm_tasks');
    },
    async upsertTask(task: CrmTask): Promise<void> {
        await updateItem('crm_tasks', task.id, task);
    },
    async setTaskStatus(id: string, status: CrmTask['status']) {
        await updateItem('crm_tasks', id, { status });
    },

    async getProfile(id: string): Promise<GuestProfile | null> {
        return fetchItem<GuestProfile>('crm_profiles', id);
    },

    // Contacts & Companies
    async listContacts(): Promise<Contact[]> {
        return fetchItems<Contact>('crm_contacts');
    },
    async upsertContact(contact: Contact): Promise<void> {
        await updateItem('crm_contacts', contact.id, contact);
    },
    async listCompanies(): Promise<CompanyAccount[]> {
        return fetchItems<CompanyAccount>('crm_companies');
    },
    async upsertCompany(company: CompanyAccount): Promise<void> {
        await updateItem('crm_companies', company.id, company);
    },

    // Interactions (activity timeline)
    async listInteractions(): Promise<Interaction[]> {
        return fetchItems<Interaction>('crm_interactions');
    },
    async upsertInteraction(interaction: Interaction): Promise<void> {
        await updateItem('crm_interactions', interaction.id, interaction);
    },
    async getInteractionsForProfile(profileId: string): Promise<Interaction[]> {
        return fetchItems<Interaction>('crm_interactions');
    },
};
