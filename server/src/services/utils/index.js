import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

//	Get base 64 image from url, locally or remote
const getBase64Image = async (imageUrl) => {
  console.log("incoming image", imageUrl);

  //  Handle both local and remote urls
  if (imageUrl.startsWith("http")) {
    // Remote fetch
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return {
        error: {
          status: 400,
          name: "FailedImageFetchImage",
          message:
            "Unable to fetch image from remote server. " +
            imageResponse.statusText,
        },
      };
    }

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType =
      imageResponse.headers.get("content-type") || "image/png";
    const base64Image = `data:${contentType};base64,${buffer.toString("base64")}`;

    return base64Image;
  } else {
    // Local read
    const strapiPath = strapi.config.get("server.dirs.public");
    const filePath = path.join(strapiPath, imageUrl);
    const buffer = await fs.readFile(filePath);
    const contentType = mime.lookup(filePath) || "image/png";
    const base64Image = `data:${contentType};base64,${buffer.toString("base64")}`;

    return base64Image;
  }
};

export { getBase64Image };
