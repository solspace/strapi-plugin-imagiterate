import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { useIntl } from "react-intl";
const Input = React.forwardRef((props, ref) => {
  const { attribute, disabled, intlLabel, name, onChange, required, value } =
    props;
  const { formatMessage } = useIntl();
  const handleChange = (e) => {
    onChange({
      target: { name, type: attribute.type, value: e.currentTarget.value },
    });
  };
  return /* @__PURE__ */ jsxs("label", {
    children: [
      intlLabel?.id
        ? formatMessage(intlLabel)
        : intlLabel?.defaultMessage || "Meow",
      /* @__PURE__ */ jsx("input", {
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
export { Input };
//# sourceMappingURL=Input-Rr8nQQJc.mjs.map
