import { getTranslation } from "./utils/getTranslation";
import { PLUGIN_ID } from "./pluginId";
import { Initializer } from "./components/Initializer";
import { AiIcon } from "./components/icons/AiIcon";

export default {
  register(app) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });

    app.customFields.register({
      name: "imagiterateField",
      pluginId: PLUGIN_ID,
      type: "string",
      icon: AiIcon,
      intlLabel: {
        id: "imagiterate.imagiterateField.label",
        defaultMessage: "Imagiterate Field",
      },
      intlDescription: {
        id: "imagiterate.imagiterateField.description",
        defaultMessage: "A plain AI field",
      },
      icon: AiIcon,
      components: {
        Input: async () =>
          import("./components/Input").then((module) => ({
            default: module.Input,
          })),
      },
    });
  },

  async registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(
            `./translations/${locale}.json`
          );

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      }),
    );
  },
};
