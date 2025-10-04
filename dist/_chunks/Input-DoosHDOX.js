"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const reactIntl = require("react-intl");
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
const Input = React__namespace.forwardRef((props, ref) => {
  const { attribute, disabled, intlLabel, name, onChange, required, value } =
    props;
  const { formatMessage } = reactIntl.useIntl();
  const handleChange = (e) => {
    onChange({
      target: { name, type: attribute.type, value: e.currentTarget.value },
    });
  };
  console.log("poo", intlLabel);
  return /* @__PURE__ */ jsxRuntime.jsxs("label", {
    children: [
      intlLabel?.id
        ? formatMessage(intlLabel)
        : intlLabel?.defaultMessage || "Meow",
      /* @__PURE__ */ jsxRuntime.jsx("input", {
        ref,
        name,
        disabled,
        value,
        required,
        onChange: handleChange,
      }),
    ],
  });
});
exports.Input = Input;
//# sourceMappingURL=Input-DoosHDOX.js.map
