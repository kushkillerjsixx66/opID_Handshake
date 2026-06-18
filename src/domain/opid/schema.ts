export const opIdHandshakeJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "opID Handshake Contract",
  type: "object",
  properties: {
    handshake_id: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
    stage: { type: "string" },
    candidate_opid: { type: "string", pattern: "^[A-Z0-9]{3}$" }
  },
  required: ["handshake_id", "timestamp", "stage", "candidate_opid"]
} as const;
