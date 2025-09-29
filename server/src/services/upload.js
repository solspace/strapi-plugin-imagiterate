import fs from "fs/promises";
import path from "path";
import mime from "mime-types";
import { v4 as uuidv4 } from "uuid";
import { validate as uuidValidate } from "uuid";
import Replicate from "replicate";

const upload = ({ strapi }) => ({
  async uploadImage(ctx) {
    const { prompt } = ctx.request.body;

    //  Do we have a prompt?
    if (!prompt) {
      return {
        error: {
          status: 500,
          name: "MissingPrompt",
          message:
            "Please provide a prompt to guide the AI in processing your image.",
        },
      };
    }

    //  Make sure we have an uploaded image
    const { files } = ctx.request;

    if (!files.image) {
      return {
        error: {
          status: 500,
          name: "MissingImage",
          message: "Please upload an image.",
        },
      };
    }

    //  First upload straight into Strapi. Strapi can deal with the mess of files.
    const uploadedFile = await uploadImage(files.image);
    if (uploadedFile.error) return uploadedFile;

    //console.log('uploaded', uploadedFile);

    // Query
    let create = await strapi
      .documents("plugin::imagiterate.imagiterate")
      .create({
        data: {
          originalImage: uploadedFile[0].id,
          token: uuidv4(),
        },
      });
    if (create.error) return create;

    //  Set the document id of the collection entry
    const documentId = create.documentId;

    //  Fetch the image
    const base64Image = await getBase64Image(uploadedFile[0].url);
    if (base64Image.error) return base64Image;

    //  Instantiate Replicate
    const { replicate, model } = getReplicate();
    if (replicate.error) return replicate;

    //  Now send it to Replicate for processing.
    const input = {
      input_image: base64Image,
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

    // Query
    const update = await strapi
      .documents("plugin::imagiterate.imagiterate")
      .update({
        documentId,
        data: {
          images: [newUploadedFile[0].id],
        },
      });
    if (update.error) return update;

    return { ...update, url: output.url(), alt: "Alt text", prompt };
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
        status: 500,
        name: "MissingReplicateToken",
        message:
          "Please provide a valid API token for the Replicate AI service.",
      },
    };
  }

  if (!model) {
    return {
      error: {
        status: 500,
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

//	Upload blob
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

//	Get base 64 image
async function getBase64Image(imageUrl) {
  //  Handle both local and remote urls
  if (imageUrl.startsWith("http")) {
    // Remote fetch
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return {
        error: {
          status: 500,
          name: "FailedImageFetchImage",
          message:
            "Please to fetch image from remote server. " + imageResponse.statusText,
        },
      };
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

    return base64Image;
  } else {
    // Local read
    const strapiPath = strapi.config.get("server.dirs.public");
    const filePath = path.join(strapiPath, imageUrl);
    const buffer = await fs.readFile(filePath);
    const base64Image = `data:image/png;base64,${buffer.toString("base64")}`;

    return base64Image;
  }
}

export default upload;
