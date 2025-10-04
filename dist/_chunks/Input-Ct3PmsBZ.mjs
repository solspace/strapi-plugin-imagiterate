import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useIntl } from "react-intl";
import { useField } from "@strapi/strapi/admin";
import { Field, Flex } from "@strapi/design-system";
import { P as PLUGIN_ID } from "./index-DMFar_fP.mjs";
const getTranslation = (id) => `${PLUGIN_ID}.${id}`;
const Input = React.forwardRef((props, ref) => {
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
  const field = useField(name);
  const { formatMessage } = useIntl();
  return /* @__PURE__ */ jsx(Field.Root, {
    name,
    id: name,
    error: field.error,
    hint,
    required,
    children: /* @__PURE__ */ jsxs(Flex, {
      direction: "column",
      alignItems: "stretch",
      gap: 1,
      children: [
        /* @__PURE__ */ jsx(Field.Label, {
          action: labelAction,
          children: label,
        }),
        /* @__PURE__ */ jsx(Field.Root, {
          children: /* @__PURE__ */ jsx(Field.Input, {
            "aria-label": formatMessage({
              id: getTranslation("imagiterate.input.aria-label"),
              defaultMessage: "Imagiterate input",
            }),
            style: { textTransform: "uppercase" },
            name,
            defaultValue: field.value ?? "heya",
            placeholder: "meow",
            onChange: field.onChange,
            ...props,
          }),
        }),
      ],
    }),
  });
});
export { Input };
//# sourceMappingURL=Input-Ct3PmsBZ.mjs.map
