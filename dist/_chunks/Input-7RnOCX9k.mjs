import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useIntl } from "react-intl";
import { useField } from "@strapi/strapi/admin";
import { Field, Flex } from "@strapi/design-system";
import { useParams } from "react-router-dom";
import { P as PLUGIN_ID } from "./index-PMmVxdHC.mjs";
const getTranslation = (id) => `${PLUGIN_ID}.${id}`;
const Input = React.forwardRef((props, ref) => {
  const {
    name,
    hint,
    label,
    labelAction,
    required,
    attribute,
    disabled,
    onChange,
  } = props;
  const field = useField(name);
  const { formatMessage } = useIntl();
  const { id: documentId } = useParams();
  console.log("Document ID:", documentId);
  const handleChange = (e) => {
    onChange({
      target: {
        name,
        type: attribute.type,
        value: e.currentTarget.value,
      },
    });
  };
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
        /* @__PURE__ */ jsx(Field.Input, {
          ref,
          "aria-label": formatMessage({
            id: getTranslation("imagiterate.input.aria-label"),
            defaultMessage: "Imagiterate input",
          }),
          name,
          value: field.value ?? "",
          disabled,
          required,
          placeholder: "Type here…",
          onChange: handleChange,
        }),
        /* @__PURE__ */ jsx(Field.Hint, {}),
        /* @__PURE__ */ jsx(Field.Error, {}),
      ],
    }),
  });
});
export { Input };
//# sourceMappingURL=Input-7RnOCX9k.mjs.map
