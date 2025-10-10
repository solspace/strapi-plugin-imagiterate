export default {
  default: ({ env }) => ({
    replicateApiToken: env("REPLICATE_API_TOKEN"),
    replicateImageModel: env("REPLICATE_IMAGE_MODEL"),
    replicateCaptionModel: env("REPLICATE_CAPTION_MODEL"),
  }),
  validator() {},
};
