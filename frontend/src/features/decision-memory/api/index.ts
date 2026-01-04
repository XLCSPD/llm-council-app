/**
 * Decision Memory API
 * Re-exports all API functions for easy importing
 */

// Search
export {
  searchSessions,
  quickSearch,
  getSessionsByTag,
  getTopRatedSessions,
} from './search';

// Annotations
export {
  getSessionAnnotation,
  upsertSessionAnnotation,
  updateSessionRating,
  updateSessionNotes,
  deleteSessionAnnotation,
  getProjectTags,
  createTag,
  updateTag,
  deleteTag,
  getSessionTags,
  addSessionTag,
  removeSessionTag,
  setSessionTags,
} from './annotations';

// Templates
export {
  getCouncilTemplates,
  getFavoriteTemplates,
  getCouncilTemplate,
  createCouncilTemplate,
  updateCouncilTemplate,
  toggleTemplateFavorite,
  recordTemplateUsage,
  deleteCouncilTemplate,
  saveCouncilAsTemplate,
} from './templates';
