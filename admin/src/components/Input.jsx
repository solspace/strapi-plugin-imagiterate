import * as React from "react";
import { useIntl } from "react-intl";
import { useField } from "@strapi/strapi/admin";
import { Field, Flex } from "@strapi/design-system";
import { useParams } from "react-router-dom";

import { getTranslation } from "../utils/getTranslation";

export const Input = React.forwardRef((props, ref) => {
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

  React.useEffect(() => {
    const testRoute = async () => {
      try {
        const res = await fetch(
          `/imagiterate/get-document?documentId=${documentId}`,
          {
            headers: {
              "Content-Type": "application/json"
            },
          },
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
        value: e.currentTarget.value,
      },
    });
  };

  return (
    <Field.Root
      name={name}
      id={name}
      error={field.error}
      hint={hint}
      required={required}
    >
      <Flex direction="column" alignItems="stretch" gap={1}>
        <Field.Label action={labelAction}>{label}</Field.Label>

        <Field.Input
          ref={ref}
          aria-label={formatMessage({
            id: getTranslation("imagiterate.input.aria-label"),
            defaultMessage: "Imagiterate input",
          })}
          name={name}
          value={field.value ?? ""}
          disabled={disabled}
          required={required}
          placeholder="Type here…"
          onChange={handleChange}
        />

        <Field.Hint />
        <Field.Error />
      </Flex>
    </Field.Root>
  );
});
