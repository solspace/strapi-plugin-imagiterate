"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const reactIntl = require("react-intl");
const admin = require("@strapi/strapi/admin");
const designSystem = require("@strapi/design-system");
const reactRouterDom = require("react-router-dom");
const index = require("./index-2cWFSudX.js");
function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespace(React);
const getTranslation = (id) => `${index.PLUGIN_ID}.${id}`;
const Input = React__namespace.forwardRef((props, ref) => {
  const {
    name,
    hint,
    label,
    labelAction,
    required,
    attribute,
    disabled,
    onChange
  } = props;
  const field = admin.useField(name);
  const { formatMessage } = reactIntl.useIntl();
  const { id: documentId } = reactRouterDom.useParams();
  console.log("Document ID:", documentId);
  React__namespace.useEffect(() => {
    const testRoute = async () => {
      try {
        const res = await fetch(
          `/admin/imagiterate/get-document?documentId=${documentId}`,
          {
            headers: {
              "Content-Type": "application/json"
              // Admin panel already has JWT baked into fetch by default,
              // but if you need it explicitly:
              // Authorization: `Bearer ${window.strapi?.auth?.getToken()}`,
            }
          }
        );
        const data = await res.json();
        console.log("Route response:", data);
      } catch (err) {
        console.error("Error hitting test route:", err);
      }
    };
    if (documentId) testRoute();
  }, [documentId]);
  const handleChange = (e) => {
    onChange({
      target: {
        name,
        type: attribute.type,
        value: e.currentTarget.value
      }
    });
  };
  return /* @__PURE__ */ jsxRuntime.jsx(
    designSystem.Field.Root,
    {
      name,
      id: name,
      error: field.error,
      hint,
      required,
      children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { direction: "column", alignItems: "stretch", gap: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { action: labelAction, children: label }),
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.Field.Input,
          {
            ref,
            "aria-label": formatMessage({
              id: getTranslation("imagiterate.input.aria-label"),
              defaultMessage: "Imagiterate input"
            }),
            name,
            value: field.value ?? "",
            disabled,
            required,
            placeholder: "Type here…",
            onChange: handleChange
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Hint, {}),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Error, {})
      ] })
    }
  );
});
exports.Input = Input;
//# sourceMappingURL=Input-qfLBnwPO.js.map
