import fs from "fs/promises";
import path from "path";

const document = ({ strapi }) => ({
  async getDocument(ctx) {
    const { documentId } = ctx.request.query;

    //  Do we have a document id?
    if (!documentId) {
      return {
        error: {
          status: 400,
          name: "MissingDocumentId",
          message: "Please provide a document id.",
        },
      };
    }

    // Query
    let imageDocument = await strapi
      .documents("plugin::imagiterate.imagiterate")
      .findOne({
        documentId,
        populate: ["originalImage", "images"],
      });
    if (imageDocument.error) return imageDocument;

    return { ...imageDocument };
  },
});

export default document;
