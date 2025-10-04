# Strapi Plugin Imagiterate

Prompt an AI to iterate on uploaded images and save them to Strapi's backend.

## Features

- Opens up the world of AI image editing to end users
- Streamlines AI editing of images
- Saves iterative results in Strapi for later
- Use saved image iterations as normal Strapi content types

## Installation

To install this plugin, you need to add an NPM dependency to your Strapi application.

```sh
# Using Yarn
yarn add @solspace/strapi-plugin-imagiterate

# Or using PNPM
pnpm add @solspace/strapi-plugin-imagiterate

# Or using NPM
npm install @solspace/strapi-plugin-imagiterate
```

## How it works

This plugin exposes two Strapi API endpoints, one for initial image uploads and another for subsequent image iterations.

Developers can build front-end applications that consume this API and allow users to upload an image along with an editing prompt. The AI modifies the image and returns the modified version through the API. The developer's front-end application can then allow the user to provide further editing prompts to iterate on subsequent modified images.

All image uploads and modifications are saved to the Strapi back-end in the Imagiterate Uploads collection. The images are saved as Strapi Media Library records attached to a main collection entry.

## Requirements

This plugin is optimized for and currently uses the AI image editing service provider [Replicate](https://replicate.com/).

- **Required:** A valid Replicate API token with valid billing credits attached to it.
- **Required:** A valid Replicate model. We recommend [black-forest-labs/flux-kontext-pro](https://replicate.com/black-forest-labs/flux-kontext-pro).
- **Required:** Appropriate permissions on the Imagiterate Strapi plugin API endpoints.

## Configuration

1. Add environment configuration values:

`.env`

```
# Replicate API Token
REPLICATE_API_TOKEN=r8_HrsCGGANKqOTmmJQhsbpIHBNMBOfHwz9JMaiQ

# Replicate AI Model
REPLICATE_AI_MODEL=black-forest-labs/flux-kontext-pro
```

2. Then set up your Strapi plugins config file to use those values. Note the addition of { env} as a function argument. And make sure you merge these config values in with whatever other plugins you are also running.

`config/plugins.ts`

```
export default ({ env }) => ({
	'imagiterate': {
		enabled: true,
		config: {
		  replicateApiToken: env('REPLICATE_API_TOKEN'),
		  replicateAiModel: env('REPLICATE_AI_MODEL'),
		},
	},
});
```

## Permissions

Access and permissions for Imagiterate API endpoints is managed through Strapi. You can create a dedicated API token in Strapi and use that in your API calls. Enable both `iterate` and `upload` controller actions.

It is strongly recommended that you not enable API access through User & Permissions Plugin Roles.

## API

There are two API endpoints for Imagiterate; Upload and Iterate. The upload endpoint takes the original image file along with a prompt. That original image is edited, saved to the Strapi backend and returned along with some other data. The iterate endpoint receives an image url and a prompt and edits the given image. That new image is saved to the Strapi backend and returned with additional data.

### Upload

`POST /api/imagiterate/upload`

The `upload` endpoint expects [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData).

```
	const formData = new FormData();
	formData.append("image", originalImageFile);
	formData.append("prompt", currentPrompt);
```

Two values are expected:

- image
  - The contents of 'image' will be the equivalent of the contents of an HTML form input field of type 'file' with a name of 'image'.
- prompt
  - The 'prompt' is a string that describes the edits to make to a submitted image.

The `upload` method creates a new entry in the Imagiterate Uploads collection. It returns that object in a standard Strapi API response for a [Document Service findOne()](https://docs.strapi.io/cms/api/document-service#findone) call with some additions.

- token
  - Imagiterate generates a unique token after each valid API call. This new token is expected to be provided in the next API call.
- url
  - The edited image is available through this url.
- prompt
  - The submitted AI prompt is returned for reference.

### Iterate

`POST /api/imagiterate/iterate`

The `iterate` endpoint expects a standard POST request payload. Four values are required:

- documentId
  - This is the Imagiterate Uploads collection document id. Subsequent iteration images get attached to the initial Imagiterate Uploads document.
- url
  - This is the new image created from the image submitted in the 'url' argument.
- prompt
  - The submitted AI prompt is returned for reference.
- token
  - This is the random UUID token provided in the previous Imagiterate API response.

## Costs

AI is not cheap. Replicate charges $0.04 per image output for the `black-forest-labs/flux-kontext-pro` AI model. This is an excellent model, but beware of costs accumulating.

## Disclaimer

Solspace, Inc. is not responsible for any costs incurred through your use of Imagirate and its integration with the Replicate AI service.
