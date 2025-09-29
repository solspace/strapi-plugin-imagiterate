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
});

export default controller;
