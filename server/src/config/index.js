export default {
  default: ({ env }) => ({
    replicateApiToken: env("REPLICATE_API_TOKEN"),
    replicateAiModel: env("REPLICATE_AI_MODEL"),
  }),
  validator() {},
};
