import { useRef, useEffect } from "react";
import { jsx } from "react/jsx-runtime";
import { Sparkles } from "lucide-react";
const __variableDynamicImportRuntimeHelper = (glob, path, segs) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " +
            path +
            (path.split("/").length !== segs
              ? ". Note that variables only represent file names one level deep."
              : ""),
        ),
      ),
    );
  });
};
const PLUGIN_ID = "imagiterate";
const Initializer = ({ setPlugin }) => {
  const ref = useRef(setPlugin);
  useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);
  return null;
};
const AiIcon = () =>
  /* @__PURE__ */ jsx(Sparkles, { size: 10, color: "#666666", strokeWidth: 1 });
const index = {
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
          import("./Input-BFvST7Uf.mjs").then((module) => ({
            default: module.Input,
          })),
      },
    });
  },
  async registerTrads({ locales }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await __variableDynamicImportRuntimeHelper(
            /* @__PURE__ */ Object.assign({
              "./translations/en.json": () => import("./en-BdsnUC65.mjs"),
            }),
            `./translations/${locale}.json`,
            3,
          );
          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      }),
    );
  },
};
export { PLUGIN_ID as P, index as i };
//# sourceMappingURL=index-C0OGmxL3.mjs.map
