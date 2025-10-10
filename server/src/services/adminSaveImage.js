import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

const adminSaveImage = ({ strapi }) => ({
  async saveImage(ctx) {
    const { alternativeText, documentId, url } = ctx.request.body;
    
    console.log('incoming', alternativeText);

    //  Do we have a base64 image?
    if (!url) {
      return {
        error: {
          status: 400,
          name: "MissingImageUrl",
          message: "Please provide an image url.",
        },
      };
    }

    //  Upload to Strapi
    const newUploadedFile = await uploadImage(url, alternativeText);
    if (newUploadedFile.error) return newUploadedFile;

    //  Do we have a document id? We save our images to that document
    if (documentId) {
      // Make sure we can get our main collection document
      let imageDocument = await strapi
        .documents("plugin::imagiterate.imagiterate")
        .findOne({
          documentId,
          populate: ["images"],
        });
      if (imageDocument.error) return imageDocument;

      //  Merge new image into images array
      const mergedImages = [
        ...(imageDocument.images || []).map((img) => img.id),
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

      //	Return
      return imageDocument;
    }

    if (!documentId) {
      return newUploadedFile;
    }
  },
});

//  Service loader
const getUploadService = () => {
  return strapi.plugin("upload").service("upload");
};

async function uploadImage(url, alternativeText = 'Image alt text') {
  // Instantiate our service
  const uploadService = getUploadService();

  try {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid image URL");
    }

    // Fetch the image from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Determine mime type from headers or URL extension
    const mimeType =
      response.headers.get("content-type") ||
      mime.lookup(url) ||
      "application/octet-stream";
    const ext = mime.extension(mimeType) || "jpg";

    // Read the response body into a buffer
    const buffer = Buffer.from(await response.arrayBuffer());

    // Create a temporary file path
    const strapiPath = strapi.config.get("server.dirs.public");
    const fileName = `/uploads/replicate-${Date.now()}.${ext}`;
    const filePath = path.join(strapiPath, fileName);

    // Write image to disk
    await fs.writeFile(filePath, buffer);

    // Gather file info
    const stats = await fs.stat(filePath);
    const file = {
      filepath: filePath,
      originalFilename: `replicate-${Date.now()}.${ext}`,
      mimetype: mimeType,
      size: stats.size,
    };

    strapi.log.info(`Uploading image: ${file.originalFilename}`);
    console.log('alt text', alternativeText)

    // Upload using Strapi's upload service
    const uploadedFile = await uploadService.upload({
      data: {
      	fileInfo: {
			alternativeText
      	}
      },
      files: file,
    });
    if (uploadedFile.error) return uploadedFile;

    strapi.log.info(`Uploaded this image: ${file.originalFilename}`);

    // Clean up temporary file
    await fs.unlink(filePath);

    return uploadedFile;
  } catch (error) {
    strapi.log.error("Failed to upload image from URL:", error);
    return { error: { message: error.message } };
  }
}

export default adminSaveImage;
