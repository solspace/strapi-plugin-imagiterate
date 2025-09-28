import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { validate as uuidValidate } from 'uuid';
import Replicate from 'replicate';

const upload = ({ strapi }) => ({
  async uploadImage(ctx) {
    const { prompt } = ctx.request.body;

    //  Do we have a prompt?
    if (!prompt) {
      return {
        error: {
          status: 500,
          name: 'MissingPrompt',
          message: 'Please provide a prompt to guide the AI in processing your image.',
        },
      };
    }

    //  Make sure we have an uploaded image
    const { files } = ctx.request;

    if (!files.image) {
      return {
        error: {
          status: 500,
          name: 'MissingImage',
          message: 'Please upload an image.',
        },
      };
    }

    //  First upload straight into Strapi. Strapi can deal with the mess of files.
    const uploadedFile = await uploadImage(files.image);
    if (uploadedFile.error) return uploadedFile;

    //console.log('uploaded', uploadedFile);

    // Query
    let create = await strapi.documents('plugin::imagiterate.imagiterate').create({
      data: {
        originalImage: uploadedFile[0].id,
        token: uuidv4(),
      }
    });
    if (create.error) return create;

    /*
    const fakeImages = [
      'http://localhost:1337/uploads/steven_cordes_Exo0_AZ_Aye_M8_unsplash_c2cbe9f625.jpg',
      'http://localhost:1337/uploads/celine_chamiot_poncet_DH_9_U5x8d_Ym_U_unsplash_205cff5701.jpg',
      'http://localhost:1337/uploads/nick_van_den_berg_6x387_K_M_Wt_I_unsplash_87ae6e75ab.jpg',
    ];
    const randomImage = fakeImages[Math.floor(Math.random() * fakeImages.length)];
  */

    //  Set the document id of the collection entry
    const documentId = create.documentId;

    // Get the local file path for images uploaded to the public dir.
    const strapiPath = strapi.config.get('server.dirs.public');

    //  Now fetch a buffer and base64 of the image back out of the file system
    const filePath = path.join(strapiPath, uploadedFile[0].url);
    let buffer = await fs.readFile(filePath);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    //  Instantiate Replicate
    const { replicate, model } = getReplicate();
    if (replicate.error) return replicate;

    //  Now send it to Replicate for processing.
    const input = {
      input_image: base64Image,
      prompt,
    };
    const output = await replicate.run(model, { input });
    
    console.log('replicate output', output);

    //  Error?
    if (output.error) return output;

    //  Return image url
    const blob = await output.blob();

    //  Upload
    const newUploadedFile = await uploadBlob(blob);
    if (newUploadedFile.error) return newUploadedFile;

    // Query
    const update = await strapi.documents('plugin::imagiterate.imagiterate').update({
      documentId,
      data: {
        images: [newUploadedFile[0].id],
      },
    });
    if (update.error) return update;

    return { ...update, url: output.url(), alt: 'Alt text', prompt };
  },
});

//  Service loader
const getUploadService = () => {
  return strapi.plugin('upload').service('upload');
};

//  Replicate api loader for clean error handling
const getReplicate = () => {
  const token = strapi.plugin('imagiterate').config('replicateApiToken') || null;
  const model = strapi.plugin('imagiterate').config('replicateAiModel') || null;

  if (!token) {
    return {
      error: {
        status: 500,
        name: 'MissingReplicateToken',
        message: 'Please provide a valid API token for the Replicate AI service.',
      },
    };
  }

  if (!model) {
    return {
      error: {
        status: 500,
        name: 'MissingReplicateApiModel',
        message: 'Please provide a valid model for the Replicate AI service.',
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
  const mimeType = blob.type || 'application/octet-stream';
  const ext = mime.extension(mimeType) || 'jpg';

  // Write buffer to a temp file
  const strapiPath = strapi.config.get('server.dirs.public');
  const fileName = `/uploads/replicate-${Date.now()}.${ext}`;
  const filePath = path.join(strapiPath, fileName);
  await fs.writeFile(filePath, buffer);

  // Build the file object Strapi expects
  const stats = await fs.stat(filePath);
  const file = {
    filepath: filePath,
    originalFilename: 'replicate-ai-file',
    mimetype: mimeType,
    size: stats.size,
  };

  // Call Strapi’s upload service
  const uploadedFile = await uploadImage(file);

  // Clean up temp file
  await fs.unlink(filePath);

  return uploadedFile;
}

export default upload;
