import { PLUGIN_ID } from "/admin/src/pluginId";

const register = ({ strapi }) => {
  strapi.customFields.register({
    name: "imagiterateField",
    plugin: PLUGIN_ID,
    type: "string",
  });
};

export default register;
