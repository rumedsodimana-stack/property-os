import { useEffect, useState, useCallback } from 'react';
import { subscribeToItems } from '../kernel/firestoreService';
import { Campaign, CrmTask, GuestProfile, Segment, Interaction, Contact, CompanyAccount } from '../../types/crm';
import { crmService } from './crmService';

type Unsub = () => void;

export const useCrmController = () => {
  const [profiles, setProfiles] = useState<GuestProfile[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<CompanyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubs: Unsub[] = [];
    try {
      unsubs.push(subscribeToItems<GuestProfile>('crm_profiles', setProfiles, setError));
      unsubs.push(subscribeToItems<Segment>('crm_segments', setSegments, setError));
      unsubs.push(subscribeToItems<Campaign>('crm_campaigns', setCampaigns, setError));
      unsubs.push(subscribeToItems<CrmTask>('crm_tasks', setTasks, setError));
      unsubs.push(subscribeToItems<Interaction>('crm_interactions', setInteractions, setError));
      unsubs.push(subscribeToItems<Contact>('crm_contacts', setContacts, setError));
      unsubs.push(subscribeToItems<CompanyAccount>('crm_companies', setCompanies, setError));
    } catch (e: any) {
      setError(e?.message || 'CRM subscriptions failed');
    } finally {
      setLoading(false);
    }
    return () => unsubs.forEach(u => u && u());
  }, []);

  const saveProfile = useCallback(crmService.upsertProfile, []);
  const mergeProfile = useCallback(crmService.mergeProfile, []);
  const saveSegment = useCallback(crmService.upsertSegment, []);
  const saveCampaign = useCallback(crmService.upsertCampaign, []);
  const saveTask = useCallback(crmService.upsertTask, []);
  const setTaskStatus = useCallback(crmService.setTaskStatus, []);
  const saveInteraction = useCallback(crmService.upsertInteraction, []);
  const saveContact = useCallback(crmService.upsertContact, []);
  const saveCompany = useCallback(crmService.upsertCompany, []);

  return {
    data: { profiles, segments, campaigns, tasks, interactions, contacts, companies },
    loading,
    error,
    actions: { saveProfile, mergeProfile, saveSegment, saveCampaign, saveTask, setTaskStatus, saveInteraction, saveContact, saveCompany }
  };
};
