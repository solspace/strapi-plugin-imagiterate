const controller = ({ strapi }) => ({
  async iterate(ctx) {
    ctx.body = await strapi
      .plugin("imagiterate")
      .service("iterate")
      .refineImage(ctx);
  },
  async upload(ctx) {
    ctx.body = await strapi
      .plugin("imagiterate")
      .service("upload")
      .uploadImage(ctx);
  },
  async adminIterate(ctx) {
    ctx.body = await strapi
      .plugin("imagiterate")
      .service("adminIterate")
      .refineImage(ctx);
  },
  async getDocument(ctx) {
    ctx.body = await strapi
      .plugin("imagiterate")
      .service("document")
      .getDocument(ctx);
  },
  async saveImage(ctx) {
    ctx.body = await strapi
      .plugin("imagiterate")
      .service("adminSaveImage")
      .saveImage(ctx);
  },
});

export default controller;
