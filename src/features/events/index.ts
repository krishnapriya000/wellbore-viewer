export { DrillEventSchema, EVENT_TYPES, type DrillEvent, type EventType } from './model/types';
export {
  useEventsStore,
  INITIAL_EVENTS,
  EVENT_TYPE_LABELS,
  getEventCategory,
  type EventsState,
  type EventCategory,
} from './model/eventsStore';
export { EventEditor } from './ui/EventEditor';

// Pure event icons & styling
export {
  drawEventIcon,
  getEventColors,
  getEventCategoryFromType,
  CATEGORY_COLORS,
  EVENT_SPECIFIC_COLORS,
  createEventIconDataUrl,
  type EventIconColors,
  type DrawIconOptions,
} from './lib/eventIcons';

// 3D event markers positioning
export {
  computeEventMarkers,
  surveyPointToScene,
  getUnplacedEventDiagnostics,
  SCALE as EVENT_SCALE,
  type PlacedEventMarker,
  type UnplacedEventDiagnostic,
} from './lib/eventMarkers';

// Live feed event crossing detection
export {
  detectCrossings,
  findPassedEvents,
  formatEventFeedText,
  formatSurveyFeedText,
  type CrossingCandidate,
} from './lib/eventCrossing';
