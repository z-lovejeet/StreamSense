/**
 * StreamSense TypeScript type definitions.
 *
 * Maps to backend Pydantic schemas and SQLAlchemy models.
 */

// ── User ──

export interface User {
  id: string
  email: string
  full_name: string
  role: "volunteer" | "researcher"
  avatar_url: string | null
  city: string | null
  created_at: string
  updated_at: string
}

export interface UserSyncResponse {
  user: User
  role: string
}

// ── Observation ──

export type ObservationStatus =
  | "processing"
  | "auto_validated"
  | "pending_review"
  | "expert_validated"
  | "rejected"

export interface Observation {
  id: string
  user_id: string
  volunteer_name?: string | null
  volunteer_email?: string | null
  volunteer_avatar_url?: string | null
  image_url: string
  image_thumbnail_url: string | null
  description: string | null
  latitude: number
  longitude: number
  location_name: string | null
  pilot_city: string | null
  observed_at: string
  status: ObservationStatus
  confidence_score: number | null
  routing: string | null
  top_species: string | null
  top_confidence: number | null
  impact_text: string | null
  impact_headline: string | null
  pipeline_time_seconds: number | null
  pipeline_error: string | null
  created_at: string
  updated_at: string
}

export interface ObservationCreate {
  image_url: string
  description?: string
  latitude: number
  longitude: number
  location_name?: string
  timestamp: string
}

export interface ObservationListResponse {
  observations: Observation[]
  total: number
  page: number
}

export interface ObservationCreateResponse {
  observation: Observation
  pipeline_task_id: string
}

// ── AI Result ──

export interface AIResult {
  id: string
  observation_id: string
  agent_name: string
  agent_version: string
  model_used: string
  status: string
  result: Record<string, unknown>
  processing_time_ms: number | null
  token_count_input: number | null
  token_count_output: number | null
  error_message: string | null
  created_at: string
}

// ── Review ──

export interface Review {
  id: string
  observation_id: string
  reviewer_id: string
  action: "confirm" | "correct" | "reject"
  corrections: Record<string, unknown> | null
  rejection_reason: string | null
  review_notes: string | null
  review_time_seconds: number | null
  created_at: string
}

export interface ReviewCreate {
  action: "confirm" | "correct" | "reject"
  corrections?: Record<string, unknown>
  rejection_reason?: string
  review_notes?: string
  review_time_seconds?: number
}

// ── FHIR ──

export interface FHIRResource {
  id: string
  observation_id: string
  resource_type: string
  profile_url: string
  resource_json: Record<string, unknown>
  validation_status: string
  sandbox_status: string
  sandbox_id: string | null
  created_at: string
  posted_at: string | null
  // Linked observation fields
  top_species?: string | null
  location_name?: string | null
  pilot_city?: string | null
  image_url?: string | null
  image_thumbnail_url?: string | null
  confidence_score?: number | null
  volunteer_name?: string | null
  observed_at?: string | null
  observation_status?: string | null
  bmwp_score?: number | null
  water_quality_indication?: string | null
}


// ── Observation Detail ──

export interface ObservationDetail {
  observation: Observation
  ai_results: AIResult[]
  review: Review | null
  fhir_resource: FHIRResource | null
}

// ── Agent Status (Pipeline) ──

export interface AgentStatus {
  agent: string
  status: string
}

export interface ObservationStatusResponse {
  status: string
  agent_statuses: AgentStatus[]
}

// ── SSE Events ──

export interface SSEAgentUpdate {
  agent: string
  status: string
  summary?: string
  result?: Record<string, unknown>
}

export interface SSEPipelineComplete {
  score: number
  routing: string
  pipeline_time_seconds: number
  results: Record<string, unknown>
}

// ── Analytics ──

export interface SummaryStats {
  total_observations: number
  auto_validated_count: number
  expert_validated_count: number
  rejected_count: number
  pending_review: number
  avg_confidence: number | null
  avg_pipeline_time: number | null
}

export interface TimelineEntry {
  date: string
  submissions: number
  validated: number
}

export interface SpeciesEntry {
  species: string
  common_name: string | null
  count: number
  avg_confidence: number | null
}

// ── Notification ──

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  observation_id: string | null
  read: boolean
  created_at: string
}

// ── GeoJSON (for /validated/map) ──

export interface GeoJSONFeature {
  type: "Feature"
  geometry: {
    type: "Point"
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    id: string
    species: string | null
    confidence: number | null
    validation_type: string
    observed_at: string | null
    thumbnail_url: string | null
    location_name: string | null
    pilot_city: string | null
  }
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}
