import fs from "fs/promises";
import path from "path";
import mime from "mime-types";
import Replicate from "replicate";

const adminIterate = ({ strapi }) => ({
  async refineImage(ctx) {
    const { documentId, prompt, url, token } = ctx.request.body;

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

    //  Do we have a prompt?
    if (!prompt) {
      return {
        error: {
          status: 400,
          name: "MissingPrompt",
          message:
            "Please provide a prompt to guide the AI in processing your image.",
        },
      };
    }

    //  Do we have an image url?
    if (!url) {
      return {
        error: {
          status: 400,
          name: "MissingImageUrl",
          message: "Please provide an image url for the AI to process.",
        },
      };
    }

    // Query
    let imageDocument = await strapi
      .documents("plugin::imagiterate.imagiterate")
      .findOne({
        documentId,
        populate: ["images"],
      });
    if (imageDocument.error) return imageDocument;

    //  Instantiate Replicate
    const { replicate, model } = getReplicate();
    if (replicate.error) return replicate;

    //  Now send it to Replicate for processing.
    const input = {
      input_image: url,
      prompt,
    };
    const output = await replicate.run(model, { input });

    //  Error?
    if (output.error) return output;

    //  Return image url
    const blob = await output.blob();

    //  Upload
    const newUploadedFile = await uploadBlob(blob);
    if (newUploadedFile.error) return newUploadedFile;

    //  Merge new image into images array
    const mergedImages = [
      ...imageDocument.images.map((img) => img.id),
      newUploadedFile[0].id,
    ];

    // Query
    const update = await strapi
      .documents("plugin::imagiterate.imagiterate")
      .update({
        documentId,
        data: {
          images: mergedImages,
        },
      });
    if (update.error) return update;

    return { ...imageDocument, url: output.url(), alt: "Alt text", prompt };
  },
});

//  Service loader
const getUploadService = () => {
  return strapi.plugin("upload").service("upload");
};

//  Replicate api loader for clean error handling
const getReplicate = () => {
  const token =
    strapi.plugin("imagiterate").config("replicateApiToken") || null;
  const model = strapi.plugin("imagiterate").config("replicateAiModel") || null;

  if (!token) {
    return {
      error: {
        status: 400,
        name: "MissingReplicateToken",
        message:
          "Please provide a valid API token for the Replicate AI service.",
      },
    };
  }

  if (!model) {
    return {
      error: {
        status: 400,
        name: "MissingReplicateApiModel",
        message: "Please provide a valid model for the Replicate AI service.",
      },
    };
  }

  const replicate = new Replicate({
    auth: token,
  });

  return { replicate, model };
};

async function uploadImage(file) {
  // Instantiate our service
  const uploadService = getUploadService();

  const uploadedFile = await uploadService.upload({
    data: {},
    files: file,
  });

  return uploadedFile;
}

async function uploadBlob(blob) {
  // Convert blob → buffer
  const buffer = Buffer.from(await blob.arrayBuffer());

  // Resolve file extension from MIME type
  const mimeType = blob.type || "application/octet-stream";
  const ext = mime.extension(mimeType) || "jpg";

  // Write buffer to a temp file
  const strapiPath = strapi.config.get("server.dirs.public");
  const fileName = `/uploads/replicate-${Date.now()}.${ext}`;
  const filePath = path.join(strapiPath, fileName);
  await fs.writeFile(filePath, buffer);

  // Build the file object Strapi expects
  const stats = await fs.stat(filePath);
  const file = {
    filepath: filePath,
    originalFilename: "replicate-ai-file",
    mimetype: mimeType,
    size: stats.size,
  };

  // Call Strapi’s upload service
  const uploadedFile = await uploadImage(file);

  // Clean up temp file
  await fs.unlink(filePath);

  return uploadedFile;
}

export default adminIterate;
