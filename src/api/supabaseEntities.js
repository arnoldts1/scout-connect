/**
 * Supabase Entities service — drop-in replacement for base44.entities.EntityName.*
 *
 * Mirrors the Base44 SDK interface:
 *   .list(sort?, limit?)
 *   .filter(query?, sort?, limit?)
 *   .get(id)
 *   .create(data)
 *   .update(id, data)
 *   .delete(id)
 *   .bulkCreate(items[])
 *   .subscribe(callback)  — uses Supabase Realtime
 */
import { supabase } from '@/lib/supabase';

// Map entity names → Supabase table names (snake_case)
const TABLE_MAP = {
  Post:               'posts',
  Story:              'stories',
  Comment:            'comments',
  Conversation:       'conversations',
  Message:            'messages',
  Follow:             'follows',
  Notification:       'notifications',
  Clan:               'clans',
  Patrol:             'patrols',
  Unit:               'units',
  Badge:              'badges',
  UserBadge:          'user_badges',
  BadgeRequest:       'badge_requests',
  Event:              'events',
  Registration:       'registrations',
  Location:           'locations',
  TransportGroup:     'transport_groups',
  Course:             'courses',
  Lesson:             'lessons',
  Quiz:               'quizzes',
  ScoutProgress:      'scout_progress',
  Product:            'products',
  Order:              'orders',
  Donation:           'donations',
  RentalListing:      'rental_listings',
  DIYTutorial:        'diy_tutorials',
  MeetingPlan:        'meeting_plans',
  Game:               'games',
  CampPlan:           'camp_plans',
  PrintableTemplate:  'printable_templates',
  TrainingVideo:      'training_videos',
  CompetitionHistory: 'competition_history',
  PublicProfile:      'public_profiles',
  Music:              'music',
  JoinRequest:        'join_requests',
  RevenuePayment:     'revenue_payments',
  Subscription:       'subscriptions',
  User:               'users',
};

/** Parse sort string like "-created_date" → { column, ascending } */
function parseSort(sort) {
  if (!sort) return { column: 'created_date', ascending: false };
  const desc = sort.startsWith('-');
  return { column: desc ? sort.slice(1) : sort, ascending: !desc };
}

/** Build a Supabase query with filter object */
function applyFilter(query, filter = {}) {
  for (const [key, value] of Object.entries(filter)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Support operators: { $gte: x }, { $lte: x }, { $in: [] }
      if (value.$gte !== undefined) query = query.gte(key, value.$gte);
      if (value.$lte !== undefined) query = query.lte(key, value.$lte);
      if (value.$in  !== undefined) query = query.in(key, value.$in);
      if (value.$neq !== undefined) query = query.neq(key, value.$neq);
    } else {
      query = query.eq(key, value);
    }
  }
  return query;
}

function makeEntity(entityName) {
  const table = TABLE_MAP[entityName];
  if (!table) throw new Error(`[supabaseEntities] Unknown entity: ${entityName}`);

  return {
    async list(sort, limit = 50) {
      const { column, ascending } = parseSort(sort);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(column, { ascending })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    async filter(filterObj = {}, sort, limit = 50) {
      const { column, ascending } = parseSort(sort);
      let q = supabase.from(table).select('*');
      q = applyFilter(q, filterObj);
      const { data, error } = await q.order(column, { ascending }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(rowData) {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ...rowData,
        created_by_id: user?.id ?? null,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, rowData) {
      const payload = { ...rowData, updated_date: new Date().toISOString() };
      delete payload.id;
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    async bulkCreate(items) {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const payload = items.map(item => ({
        ...item,
        created_by_id: user?.id ?? null,
        created_date: now,
        updated_date: now,
      }));
      const { data, error } = await supabase.from(table).insert(payload).select();
      if (error) throw error;
      return data ?? [];
    },

    /** Real-time subscription via Supabase Realtime */
    subscribe(callback) {
      const channel = supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const typeMap = { INSERT: 'create', UPDATE: 'update', DELETE: 'delete' };
          callback({
            type: typeMap[payload.eventType] ?? payload.eventType,
            id: payload.new?.id ?? payload.old?.id,
            data: payload.new ?? payload.old,
          });
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    },

    /** Returns a mock schema — not needed for Supabase but keeps API surface intact */
    async schema() {
      return {};
    },
  };
}

// Proxy so any entity name works: entities.Post, entities.Clan, etc.
export const entities = new Proxy(
  {},
  { get(_, name) { return makeEntity(String(name)); } }
);