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
yarn add strapi-plugin-imagiterate

# Or using PNPM
pnpm add strapi-plugin-imagiterate

# Or using NPM
npm install strapi-plugin-imagiterate
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

`config/plugins.ts`

```ts
export default () => ({
  // ...
  imagiterate: {
    enabled: true,
  },
  // ...
});
```

Then, add environment configuration values:

`.env`

```
# Replicate API Token
REPLICATE_API_TOKEN=r8_HrsCGGANKqOTmmJQhsbpIHBNMBOfHwz9JMaiQ

# Replicate AI Model
REPLICATE_AI_MODEL=black-forest-labs/flux-kontext-pro
```

Then, you'll need to build your server endpoints:

```sh
# Using Yarn
yarn build

# Or using PNPM
pnpm build

# Or using NPM
npm run build
```