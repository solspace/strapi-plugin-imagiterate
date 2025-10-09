import { getTranslation } from "./utils/getTranslation";
import { prefixPluginTranslations } from "./utils/prefixPluginTranslations";
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

    // Register a widget for the Homepage
    app.widgets.register({
      icon: AiIcon,
      title: {
        id: `${PLUGIN_ID}.widget.title`,
        defaultMessage: "Imagiterate",
      },
      component: async () => {
        const component = await import("./components/ImagiterateWidget");
        return component.default;
      },
      id: "imagiterate-widget",
      pluginId: PLUGIN_ID,
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
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, PLUGIN_ID),
              locale,
            };
          })
          .catch((error) => {
            return {
              data: {},
              locale,
            };
          });
      }),
    );

    return Promise.resolve(importedTrads);
  },
};
