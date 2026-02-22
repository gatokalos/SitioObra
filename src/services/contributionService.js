import { supabasePublic } from '@/lib/supabaseClient';

const PUBLIC_COLUMNS = `
  id,
  name,
  proposal,
  topic,
  created_at
`;

// Compatibilidad: hay tópicos antiguos en la tabla (la_novela, la_taza, grafico…)
const TOPIC_ALIASES = {
  novela: ['la_novela'],
  artesanias: ['la_taza'],
  graficos: ['grafico'],
};

export async function fetchApprovedContributions(topic) {
  if (!topic) {
    return { data: [], error: null };
  }

  const topicList = TOPIC_ALIASES[topic] ? [topic, ...TOPIC_ALIASES[topic]] : [topic];

  const { data, error } = await supabasePublic
    .from('blog_contributions')
    .select(PUBLIC_COLUMNS)
    .in('status', ['aprobado', 'approved'])
    .in('topic', topicList)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}
