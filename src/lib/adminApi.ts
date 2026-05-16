import { supabase } from './supabase';
import { Database } from './database.types';

type Athlete = Database['public']['Tables']['athletes']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type KnowledgeBase = Database['public']['Tables']['knowledge_base']['Row'];
type KnowledgeBaseInsert = Database['public']['Tables']['knowledge_base']['Insert'];
type KnowledgeBaseUpdate = Database['public']['Tables']['knowledge_base']['Update'];

export async function getAllUsers() {
  console.log('Fetching users...');

  const response = await supabase
    .from('athletes')
    .select('id, name, email, role')
    .limit(5);

  console.log('Users response:', response);

  if (response.error) {
    console.error(response.error);
    return [];
  }

  return response.data || [];
}

export async function getUserChats(athleteId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data as ChatMessage[];
}

export async function updateUserRole(athleteId: string, newRole: 'user' | 'admin') {
  const { error } = await supabase
    .from('athletes')
    .update({ role: newRole })
    .eq('id', athleteId);

  if (error) throw error;
}

export async function deleteUser(athleteId: string) {
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', athleteId);

  if (error) throw error;
}

export async function getAllKnowledgeBase() {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as KnowledgeBase[];
}

export async function createKnowledgeBase(kbData: KnowledgeBaseInsert) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(kbData)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeBase;
}

export async function updateKnowledgeBase(id: string, kbData: KnowledgeBaseUpdate) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .update(kbData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeBase;
}

export async function deleteKnowledgeBase(id: string) {
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteChatMessage(messageId: string) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

export async function getUserStats(athleteId: string) {
  const [chatsResult, metricsResult, nutritionResult] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId),
    supabase
      .from('fitness_metrics')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId),
    supabase
      .from('nutrition_logs')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId),
  ]);

  return {
    chatCount: chatsResult.count || 0,
    metricsCount: metricsResult.count || 0,
    nutritionCount: nutritionResult.count || 0,
  };
}

export async function getAllChatsGroupedByUser() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      athletes:athlete_id (
        id,
        name,
        email
      )
    `)
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data;
}
