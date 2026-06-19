/**
 * api/entities.js  –  replaces base44.entities.*
 *
 * Mirrors the base44 SDK interface:
 *   entities.Post.list(sort, limit)
 *   entities.Post.filter(query, sort, limit)
 *   entities.Post.create(data)
 *   entities.Post.update(id, data)
 *   entities.Post.delete(id)
 *
 * Resource-to-endpoint mapping lives in RESOURCE_MAP below.
 */
import { http } from './client';

// Maps entity name → { endpoint, queryParam? }
// queryParam: extra GET param to qualify sub-resources (e.g. ?resource=user_badge)
const RESOURCE_MAP = {
  Post:              { endpoint: 'api/posts' },
  Story:             { endpoint: 'api/stories' },
  Comment:           { endpoint: 'api/comments' },
  Notification:      { endpoint: 'api/notifications' },
  Conversation:      { endpoint: 'api/conversations' },
  Message:           { endpoint: 'api/messages' },
  Follow:            { endpoint: 'api/follows' },
  User:              { endpoint: 'api/users' },
  PublicProfile:     { endpoint: 'api/public_profiles' },
  Unit:              { endpoint: 'api/units' },
  Clan:              { endpoint: 'api/clans' },
  Patrol:            { endpoint: 'api/patrols' },
  Badge:             { endpoint: 'api/badges',   queryParam: { resource: 'badge' } },
  UserBadge:         { endpoint: 'api/badges',   queryParam: { resource: 'user_badge' } },
  BadgeRequest:      { endpoint: 'api/badges',   queryParam: { resource: 'badge_request' } },
  Event:             { endpoint: 'api/events' },
  Registration:      { endpoint: 'api/events',   queryParam: { resource: 'registration' } },
  Product:           { endpoint: 'api/products' },
  RentalListing:     { endpoint: 'api/rentals' },
  Course:            { endpoint: 'api/courses',  queryParam: { resource: 'course' } },
  Lesson:            { endpoint: 'api/courses',  queryParam: { resource: 'lesson' } },
  ScoutProgress:     { endpoint: 'api/courses',  queryParam: { resource: 'progress' } },
  Music:             { endpoint: 'api/music' },
  JoinRequest:       { endpoint: 'api/join_requests' },
};

function makeEntity(name) {
  const { endpoint, queryParam = {} } = RESOURCE_MAP[name] ?? {};
  if (!endpoint) throw new Error(`Unknown entity: ${name}`);

  /** Parse sort string: "-created_date" → { sort: "created_date", order: "desc" } */
  function parseSort(sort) {
    if (!sort) return {};
    const desc = sort.startsWith('-');
    return { sort_by: desc ? sort.slice(1) : sort, sort_order: desc ? 'desc' : 'asc' };
  }

  return {
    /** list(sort?, limit?) */
    list(sort, limit) {
      return http.get(endpoint, { ...queryParam, ...parseSort(sort), limit });
    },

    /** filter(queryObj, sort?, limit?) */
    filter(query = {}, sort, limit) {
      return http.get(endpoint, { ...queryParam, ...query, ...parseSort(sort), limit });
    },

    /** get single record by id */
    get(id) {
      return http.get(endpoint, { ...queryParam, id });
    },

    /** create(data) */
    create(data) {
      return http.post(endpoint, data, queryParam);
    },

    /** update(id, data) */
    update(id, data) {
      return http.patch(endpoint, { ...data, id }, queryParam);
    },

    /** delete(id) */
    delete(id) {
      return http.delete(endpoint, { ...queryParam, id });
    },

    /** bulkCreate(items[]) */
    bulkCreate(items) {
      return Promise.all(items.map(item => http.post(endpoint, item, queryParam)));
    },

    /** schema() – returns field list from backend */
    schema() {
      return http.get(endpoint, { ...queryParam, action: 'schema' });
    },

    /** subscribe() – no-op shim (real-time not available in PHP) */
    subscribe(callback) {
      console.warn(`[entities] Real-time subscribe not supported in PHP backend for ${name}. Use polling.`);
      return () => {};
    },
  };
}

// Build the entities proxy object dynamically
export const entities = new Proxy({}, {
  get(_, name) {
    return makeEntity(name);
  },
});