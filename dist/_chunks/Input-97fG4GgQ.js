"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const reactIntl = require("react-intl");
const admin = require("@strapi/strapi/admin");
const designSystem = require("@strapi/design-system");
const index = require("./index-Cg_mydPh.js");
function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(
          n,
          k,
          d.get
            ? d
            : {
                enumerable: true,
                get: () => e[k],
              },
        );
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
    hint,
    label,
    name,
    value,
    onChange,
    disabled,
    labelAction,
    required,
    attribute,
  } = props;
  const field = admin.useField(name);
  const { formatMessage } = reactIntl.useIntl();
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Root, {
    name,
    id: name,
    error: field.error,
    hint,
    required,
    children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, {
      direction: "column",
      alignItems: "stretch",
      gap: 1,
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, {
          action: labelAction,
          children: label,
        }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Root, {
          children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Input, {
            "aria-label": formatMessage({
              id: getTranslation("imagiterate.input.aria-label"),
              defaultMessage: "Imagiterate input",
            }),
            style: { textTransform: "uppercase" },
            name,
            defaultValue: color,
            placeholder: "meow",
            onChange: field.onChange,
            ...props,
          }),
        }),
      ],
    }),
  });
});
exports.Input = Input;
//# sourceMappingURL=Input-97fG4GgQ.js.map
