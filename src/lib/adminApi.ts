import { supabase } from './supabase';
import { Database } from './database.types';

type Athlete =
  Database['public']['Tables']['athletes']['Row'];

type ChatMessage =
  Database['public']['Tables']['chat_messages']['Row'];

type KnowledgeBase =
  Database['public']['Tables']['knowledge_base']['Row'];

type KnowledgeBaseInsert =
  Database['public']['Tables']['knowledge_base']['Insert'];

type KnowledgeBaseUpdate =
  Database['public']['Tables']['knowledge_base']['Update'];

async function withTimeout<T>(
  promise: Promise<T>,
  ms = 10000
): Promise<T> {
  return Promise.race([
    promise,

    new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, ms)
    ),
  ]);
}

// =========================
// USERS
// =========================
export async function getAllUsers() {
  const result = await withTimeout(
    supabase
      .from('athletes')
      .select('*')
      .order('created_at', {
        ascending: false,
      })
  );

  if (result.error) {
    console.error(
      'getAllUsers error:',
      result.error
    );

    throw result.error;
  }

  return (result.data ||
    []) as Athlete[];
}

export async function getUserChats(
  athleteId: string
) {
  const result = await withTimeout(
    supabase
      .from('chat_messages')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('timestamp', {
        ascending: true,
      })
  );

  if (result.error) {
    console.error(
      'getUserChats error:',
      result.error
    );

    throw result.error;
  }

  return (result.data ||
    []) as ChatMessage[];
}

export async function updateUserRole(
  athleteId: string,
  newRole: 'user' | 'admin'
) {
  const { error } = await supabase
    .from('athletes')
    .update({
      role: newRole,
    })
    .eq('id', athleteId);

  if (error) throw error;
}

export async function deleteUser(
  athleteId: string
) {
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', athleteId);

  if (error) throw error;
}

// =========================
// KNOWLEDGE BASE
// =========================
export async function getAllKnowledgeBase() {
  const { data, error } =
    await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

  if (error) throw error;

  return data as KnowledgeBase[];
}

export async function createKnowledgeBase(
  kbData: KnowledgeBaseInsert
) {
  const { data, error } =
    await supabase
      .from('knowledge_base')
      .insert(kbData)
      .select()
      .single();

  if (error) throw error;

  return data as KnowledgeBase;
}

export async function updateKnowledgeBase(
  id: string,
  kbData: KnowledgeBaseUpdate
) {
  const { data, error } =
    await supabase
      .from('knowledge_base')
      .update(kbData)
      .eq('id', id)
      .select()
      .single();

  if (error) throw error;

  return data as KnowledgeBase;
}

export async function deleteKnowledgeBase(
  id: string
) {
  const { error } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =========================
// CHAT
// =========================
export async function deleteChatMessage(
  messageId: string
) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

// =========================
// STATS
// =========================
export async function getUserStats(
  athleteId: string
) {
  const chatsResult = await supabase
  .from('chat_messages')
  .select('id', {
    count: 'exact',
    head: true,
  })
  .eq('athlete_id', athleteId);

const metricsResult = await supabase
  .from('fitness_metrics')
  .select('id', {
    count: 'exact',
    head: true,
  })
  .eq('athlete_id', athleteId);

const nutritionResult = await supabase
  .from('nutrition_logs')
  .select('id', {
    count: 'exact',
    head: true,
  })
  .eq('athlete_id', athleteId);

  return {
    chatCount:
      chatsResult.count || 0,

    metricsCount:
      metricsResult.count || 0,

    nutritionCount:
      nutritionResult.count || 0,
  };
}

// =========================
// GROUPED CHATS
// =========================
export async function getAllChatsGroupedByUser() {
  const { data, error } =
    await supabase
      .from('chat_messages')
      .select(`
        *,
        athletes:athlete_id (
          id,
          name,
          email
        )
      `)
      .order('timestamp', {
        ascending: false,
      });

  if (error) throw error;

  return data;
}