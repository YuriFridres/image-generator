import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function saveMember({ email, phone }) {
  const { error } = await supabase
    .from('bot_members')
    .upsert({ email, phone }, { onConflict: 'email' });
  if (error) console.error('saveMember:', error);
}

export async function saveTelegramId({ email, telegram_user_id }) {
  const { error } = await supabase
    .from('bot_members')
    .update({ telegram_user_id })
    .eq('email', email);
  if (error) console.error('saveTelegramId:', error);
}

export async function getMemberByEmail(email) {
  const { data, error } = await supabase
    .from('bot_members')
    .select('*')
    .eq('email', email)
    .single();
  if (error) return null;
  return data;
}
