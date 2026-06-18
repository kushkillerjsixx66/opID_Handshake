export type HandshakeStage =
  | "INITIATION"
  | "SIGNATURE_VALIDATION"
  | "LINEAGE_BINDING"
  | "PRIVILEGE_TIER_RESOLUTION"
  | "ROUTING_TABLE_REGISTRATION"
  | "EVENT_TRIGGER_BINDING"
  | "COMPLETION";

export type ValidationStatus = "PASS" | "FAIL";
export type PrivilegeTier = "I" | "II" | "III" | "IV";

export interface TransmissionContext {
  origin: string;
  channel: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  structural: ValidationStatus;
  semantic: ValidationStatus;
  stability: ValidationStatus;
  errors: string[];
}

export interface LineageBinding {
  vault_pointer?: string;
  lineage_node_id?: string;
  binding_timestamp?: string;
}

export interface PrivilegeTierInfo {
  tier: PrivilegeTier;
  visibility_rights: string[];
  artifact_access: string[];
  transmission_rights: string[];
}

export interface RoutingTableInfo {
  subscriptions: string[];
  module_bindings: string[];
  event_hooks: string[];
}

export interface EventTrigger {
  trigger: string;
  action: string;
  conditions: string[];
}

export type HandshakeCompletionStatus =
  | "HANDSHAKE_COMPLETE"
  | "HANDSHAKE_FAILED";

export interface HandshakeCompletion {
  status: HandshakeCompletionStatus;
  final_message: string;
}

export interface OpIdHandshake {
  handshake_id: string;
  timestamp: string;
  stage: HandshakeStage;
  candidate_opid: string;
  transmission_context: TransmissionContext;
  validation?: ValidationResult;
  lineage_binding?: LineageBinding;
  privilege_tier?: PrivilegeTierInfo;
  routing_table?: RoutingTableInfo;
  event_triggers?: EventTrigger[];
  completion?: HandshakeCompletion;
}

export interface HandshakeRequestBody {
  candidate_opid: string;
  actor_intent?: string;
  transmission_context: TransmissionContext;
}
