import fs from "fs/promises";
import path from "path";
import mime from "mime-types";
import Replicate from "replicate";
import { getBase64Image } from "./utils";

const adminIterate = ({ strapi }) => ({
  async refineImage(ctx) {
    //	Set vars
    const { documentId, prompt, url, token } = ctx.request.body;

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

    //  For generation (no input image), url is optional
    const isGeneration = !url;

    //	If the image url is relative, we need to generate a base64 version to send to Replicate
    let base64Image;

    if (!isGeneration && !url.startsWith("http")) {
      base64Image = await getBase64Image(url);
      if (base64Image.error) {
        return base64Image;
      }
    }

    //  Set token
    const replicateToken =
      strapi.plugin("imagiterate").config("replicateApiToken") || null;

    //	Missing token?
    if (!replicateToken) {
      return {
        error: {
          status: 400,
          name: "MissingReplicateToken",
          message:
            "Please provide a valid API token for the Replicate AI service.",
        },
      };
    }

    //	Instantiate Replicate
    const replicate = new Replicate({
      auth: replicateToken,
    });

    //	Set image model
    let model =
      strapi.plugin("imagiterate").config("replicateImageModel") ||
      "black-forest-labs/flux-kontext-pro";

    //  Now send it to Replicate for processing.
    let input;
    if (isGeneration) {
      // For generation, just use the prompt
      input = { prompt };
      // Use generation model if configured
      model = strapi.plugin("imagiterate").config("replicateGenerateModel") || model;
    } else {
      // For iteration, use image + prompt
      input = {
        input_image: base64Image || url,
        prompt,
      };
    }
    
    const output = await replicate.run(model, { input });

    //  Error?
    if (output.error) return output;

    //	Set url
    const replicateUrl = await output.url();

    // Normalize to a plain string
    const resultUrl =
      typeof replicateUrl === "string" ? replicateUrl : replicateUrl.href;

    // Set caption model
    model =
      strapi.plugin("imagiterate").config("replicateCaptionModel") ||
      "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746";

    //	Get caption from Replicate
    input = { image: resultUrl };
    const replicateCaption = await replicate.run(model, { input });
    if (replicateCaption.error) return replicateCaption;

    console.log("image caption received from Replicate", replicateCaption);

    //	Parse alt text
    let alternativeText = replicateCaption || "Image alt text";
    alternativeText = alternativeText
      .replace("Caption:", "")
      .trim()
      .replace(/^([a-z])/, (match) => match.toUpperCase())
      .replace(/([^.!?])$/, "$1.");

    //	Prepare base64 of the resulting image so that we can show the image in the Strapi admin without CORS errors
    base64Image = await getBase64Image(resultUrl);

    //	Return
    return { base64Image, url: resultUrl, alternativeText, prompt };
  },
});

//  Service loader
const getUploadService = () => {
  return strapi.plugin("upload").service("upload");
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
