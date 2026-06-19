import crypto from "crypto";
import {
  EventTrigger,
  HandshakeRequestBody,
  OpIdHandshake,
  PrivilegeTier,
  PrivilegeTierInfo,
  RoutingTableInfo,
  ValidationResult
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

// Accepts any combination (any length, any order, case-insensitive) of the
// letters C, R, F, optionally mixed with digits. Must contain at least one
// of C/R/F. Examples that pass: CC, CRF, cc1, RF78, FFFCC2.
// Examples that fail: XYZ123 (no C/R/F), CARUSO (letters outside C/R/F).
function isValidOpIdFormat(candidate: string): boolean {
  return /^[CRF0-9]+$/i.test(candidate) && /[CRF]/i.test(candidate);
}

function isSemanticOperatorClass(candidate: string): boolean {
  return /^[CRF0-9]+$/i.test(candidate) && /[CRF]/i.test(candidate);
}

function isStable(candidate: string): boolean {
  return isValidOpIdFormat(candidate);
}

function computePrivilegeTier(candidate: string): PrivilegeTier {
  // Sum char codes across the whole candidate (no longer assumes length 3)
  let sum = 0;
  for (let i = 0; i < candidate.length; i++) {
    sum += candidate.charCodeAt(i);
  }

  switch (sum % 4) {
    case 0:
      return "I";
    case 1:
      return "II";
    case 2:
      return "III";
    default:
      return "IV";
  }
}

function buildPrivilegeInfo(tier: PrivilegeTier): PrivilegeTierInfo {
  return {
    tier,
    visibility_rights: ["public"],
    artifact_access: ["docs.read"],
    transmission_rights: ["handshake.retry"]
  };
}

function buildRoutingTable(candidate: string): RoutingTableInfo {
  return {
    subscriptions: ["artifact_created", "lineage_updated"],
    module_bindings: ["vault", "identity"],
    event_hooks: [`opid:${candidate}:joined`]
  };
}

function buildEventTriggers(candidate: string): EventTrigger[] {
  return [
    {
      trigger: "artifact_created",
      action: "notify_operator",
      conditions: [`opid == ${candidate}`]
    }
  ];
}

export function runOpIdHandshake(
  body: HandshakeRequestBody
): OpIdHandshake {
  const handshake_id = newId();
  const timestamp = nowIso();

  let handshake: OpIdHandshake = {
    handshake_id,
    timestamp,
    stage: "INITIATION",
    candidate_opid: body.candidate_opid,
    transmission_context: body.transmission_context
  };

  const validation: ValidationResult = {
    structural: isValidOpIdFormat(body.candidate_opid) ? "PASS" : "FAIL",
    semantic: isSemanticOperatorClass(body.candidate_opid) ? "PASS" : "FAIL",
    stability: isStable(body.candidate_opid) ? "PASS" : "FAIL",
    errors: []
  };

  handshake = { ...handshake, stage: "SIGNATURE_VALIDATION", validation };

  const allPass =
    validation.structural === "PASS" &&
    validation.semantic === "PASS" &&
    validation.stability === "PASS";

  if (!allPass) {
    return {
      ...handshake,
      stage: "COMPLETION",
      completion: {
        status: "HANDSHAKE_FAILED",
        final_message: validation.errors.join(" ")
      }
    };
  }

  const lineage_node_id = `ln-${handshake_id}`;
  const vault_pointer = `vault://opid/${body.candidate_opid}`;

  handshake = {
    ...handshake,
    stage: "LINEAGE_BINDING",
    lineage_binding: {
      lineage_node_id,
      vault_pointer,
      binding_timestamp: nowIso()
    }
  };

  const tier = computePrivilegeTier(body.candidate_opid);

  handshake = {
    ...handshake,
    stage: "PRIVILEGE_TIER_RESOLUTION",
    privilege_tier: buildPrivilegeInfo(tier)
  };

  handshake = {
    ...handshake,
    stage: "ROUTING_TABLE_REGISTRATION",
    routing_table: buildRoutingTable(body.candidate_opid)
  };

  handshake = {
    ...handshake,
    stage: "EVENT_TRIGGER_BINDING",
    event_triggers: buildEventTriggers(body.candidate_opid)
  };

  return {
    ...handshake,
    stage: "COMPLETION",
    completion: {
      status: "HANDSHAKE_COMPLETE",
      final_message: `HANDSHAKE COMPLETE. LINEAGE NODE: ${lineage_node_id}. PRIVILEGE TIER: ${tier}. ROUTING STATUS: ACTIVE.`
    }
  };
}
