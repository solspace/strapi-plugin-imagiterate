import fs from "fs/promises";
import path from "path";
import { errors } from "@strapi/utils";

const { ValidationError, ApplicationError, NotFoundError } = errors;

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
  async getImages(ctx) {
    const { documentId } = ctx.request.query;

    // Query
    const images = await strapi.documents("plugin::upload.file").findMany({
      filters: { mime: { $contains: "image" } },
      orderBy: { createdAt: "desc" },
    });
    if (images.error) return images;

    return images;
  },
});

export default document;
