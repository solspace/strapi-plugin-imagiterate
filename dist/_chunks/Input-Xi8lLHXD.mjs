import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useIntl } from "react-intl";
import { useField } from "@strapi/strapi/admin";
import {
  Field,
  Flex,
  Card,
  CardHeader,
  Typography,
  CardSubtitle,
  CardBody,
  Grid,
  Box,
  Button,
  Textarea,
  Modal,
} from "@strapi/design-system";
import { useParams } from "react-router-dom";
import { P as PLUGIN_ID } from "./index--M9ls6DR.mjs";
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
    placeholder,
    onChange,
  } = props;
  const field = useField(name);
  const { formatMessage } = useIntl();
  const { id: documentId } = useParams();
  const [images, setImages] = React.useState([]);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [prompt, setPrompt] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [modalState, setModalState] = React.useState("closed");
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [resultImage, setResultImage] = React.useState("");
  const [resultReasoning, setResultReasoning] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const timerRef = React.useRef(null);
  React.useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(
          `/imagiterate/get-document?documentId=${documentId}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const data = await res.json();
        console.log("[v0] Document data:", data);
        const imagesList = [];
        if (data.originalImage) {
          imagesList.push(data.originalImage);
        }
        if (data.images && Array.isArray(data.images)) {
          imagesList.push(...data.images);
        }
        setImages(imagesList);
      } catch (err) {
        console.error("[v0] Error fetching document:", err);
      }
    };
    if (documentId) fetchDocument();
  }, [documentId]);
  React.useEffect(() => {
    if (modalState === "loading") {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1e3);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (modalState === "closed") {
        setElapsedTime(0);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [modalState]);
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }
    if (images.length === 0 || !images[activeImageIndex]) {
      return;
    }
    setIsProcessing(true);
    setModalState("loading");
    setElapsedTime(0);
    try {
      const activeImage = images[activeImageIndex];
      const res = await fetch("/imagiterate/admin-iterate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          documentId,
          url: activeImage.url,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to process image");
      }
      const data = await res.json();
      console.log("[v0] Iterate response:", data);
      setResultImage(data.base64Image);
      setResultReasoning(data.reasoning);
      setModalState("success");
    } catch (err) {
      console.error("[v0] Error processing image:", err);
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
      setModalState("error");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSaveImage = async () => {
    try {
      const res = await fetch("/imagiterate/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          imageUrl: resultImage,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save image");
      }
      const savedImage = await res.json();
      console.log("[v0] Saved image:", savedImage);
      const newImages = [...images, savedImage];
      setImages(newImages);
      setActiveImageIndex(newImages.length - 1);
      setModalState("closed");
      setPrompt("");
      setResultImage("");
      setResultReasoning("");
    } catch (err) {
      console.error("[v0] Error saving image:", err);
      setErrorMessage("Failed to save image to collection");
      setModalState("error");
    }
  };
  const handleCloseModal = () => {
    setModalState("closed");
    setPrompt("");
    setResultImage("");
    setResultReasoning("");
    setErrorMessage("");
  };
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  return /* @__PURE__ */ jsxs(Field.Root, {
    name,
    id: name,
    error: field.error,
    hint,
    required,
    children: [
      /* @__PURE__ */ jsx(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 1,
        children: /* @__PURE__ */ jsxs(Card, {
          children: [
            /* @__PURE__ */ jsx(CardHeader, {
              children: /* @__PURE__ */ jsx(Typography, {
                fontWeight: "bold",
                children: formatMessage({
                  id: getTranslation("imagiterate.imagiterateField.label"),
                  defaultMessage: "Imagiterate AIs",
                }),
              }),
            }),
            /* @__PURE__ */ jsx(CardSubtitle, {
              children: /* @__PURE__ */ jsx(Typography, {
                children: formatMessage({
                  id: getTranslation("imagiterate.imagiterateField.subtitle"),
                  defaultMessage: "",
                }),
              }),
            }),
            /* @__PURE__ */ jsxs(CardBody, {
              children: [
                /* @__PURE__ */ jsxs(Grid.Root, {
                  gap: 4,
                  children: [
                    /* @__PURE__ */ jsx(Grid.Item, {
                      col: 6,
                      xs: 12,
                      children: /* @__PURE__ */ jsxs(Box, {
                        children: [
                          /* @__PURE__ */ jsx(Typography, {
                            variant: "sigma",
                            fontWeight: "bold",
                            marginBottom: 2,
                            children: "Images",
                          }),
                          images.length === 0
                            ? /* @__PURE__ */ jsx(Box, {
                                background: "neutral100",
                                padding: 8,
                                hasRadius: true,
                                style: {
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  minHeight: "300px",
                                },
                                children: /* @__PURE__ */ jsx(Typography, {
                                  variant: "omega",
                                  textColor: "neutral600",
                                  children:
                                    "No images available. Upload an image to get started.",
                                }),
                              })
                            : /* @__PURE__ */ jsxs(Box, {
                                children: [
                                  /* @__PURE__ */ jsx(Box, {
                                    background: "neutral100",
                                    hasRadius: true,
                                    style: {
                                      position: "relative",
                                      width: "100%",
                                      paddingBottom: "75%",
                                      overflow: "hidden",
                                    },
                                    children: /* @__PURE__ */ jsx("img", {
                                      src:
                                        images[activeImageIndex].url ||
                                        "/placeholder.svg",
                                      alt:
                                        images[activeImageIndex]
                                          .alternativeText ||
                                        `Image ${activeImageIndex + 1}`,
                                      style: {
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                      },
                                    }),
                                  }),
                                  /* @__PURE__ */ jsxs(Flex, {
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: 2,
                                    children: [
                                      /* @__PURE__ */ jsx(Button, {
                                        variant: "tertiary",
                                        size: "S",
                                        onClick: () =>
                                          setActiveImageIndex((prev) =>
                                            prev > 0
                                              ? prev - 1
                                              : images.length - 1,
                                          ),
                                        disabled:
                                          isProcessing || images.length <= 1,
                                        children: "Previous",
                                      }),
                                      /* @__PURE__ */ jsxs(Typography, {
                                        variant: "pi",
                                        textColor: "neutral600",
                                        children: [
                                          activeImageIndex + 1,
                                          " / ",
                                          images.length,
                                        ],
                                      }),
                                      /* @__PURE__ */ jsx(Button, {
                                        variant: "tertiary",
                                        size: "S",
                                        onClick: () =>
                                          setActiveImageIndex((prev) =>
                                            prev < images.length - 1
                                              ? prev + 1
                                              : 0,
                                          ),
                                        disabled:
                                          isProcessing || images.length <= 1,
                                        children: "Next",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                        ],
                      }),
                    }),
                    /* @__PURE__ */ jsx(Grid.Item, {
                      col: 6,
                      xs: 12,
                      children: /* @__PURE__ */ jsxs(Box, {
                        children: [
                          /* @__PURE__ */ jsx(Field.Label, {
                            children: "Prompt",
                          }),
                          /* @__PURE__ */ jsx(Textarea, {
                            ref,
                            "aria-label": formatMessage({
                              id: getTranslation(
                                "imagiterate.input.aria-label",
                              ),
                              defaultMessage: "Imagiterate input",
                            }),
                            name: "prompt",
                            value: prompt,
                            disabled:
                              disabled || isProcessing || images.length === 0,
                            required,
                            placeholder:
                              placeholder ||
                              "Enter a prompt to modify the active image...",
                            onChange: handlePromptChange,
                          }),
                          /* @__PURE__ */ jsx(Box, {
                            marginTop: 2,
                            children: /* @__PURE__ */ jsx(Button, {
                              onClick: handleSubmit,
                              disabled:
                                !prompt.trim() ||
                                isProcessing ||
                                images.length === 0,
                              loading: isProcessing,
                              children: "Submit",
                            }),
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                /* @__PURE__ */ jsx(Field.Hint, {}),
                /* @__PURE__ */ jsx(Field.Error, {}),
              ],
            }),
          ],
        }),
      }),
      modalState !== "closed" &&
        /* @__PURE__ */ jsx(Modal.Root, {
          open: true,
          onOpenChange: handleCloseModal,
          children: /* @__PURE__ */ jsxs(Modal.Content, {
            children: [
              /* @__PURE__ */ jsx(Modal.Header, {
                children: /* @__PURE__ */ jsxs(Modal.Title, {
                  children: [
                    modalState === "loading" &&
                      formatMessage({
                        id: getTranslation(
                          "imagiterate.imagiterateField.processingImage",
                        ),
                        defaultMessage: "Processing Image with AI now...",
                      }),
                    modalState === "success" &&
                      formatMessage({
                        id: getTranslation(
                          "imagiterate.imagiterateField.aiModifiedImage",
                        ),
                        defaultMessage: "AI Modified Image",
                      }),
                    modalState === "error" &&
                      formatMessage({
                        id: getTranslation("imagiterate.error"),
                        defaultMessage: "Error",
                      }),
                  ],
                }),
              }),
              /* @__PURE__ */ jsxs(Modal.Body, {
                children: [
                  modalState === "loading" &&
                    /* @__PURE__ */ jsxs(Box, {
                      children: [
                        /* @__PURE__ */ jsx(Flex, {
                          justifyContent: "center",
                          marginBottom: 4,
                          children: /* @__PURE__ */ jsxs(Typography, {
                            variant: "omega",
                            textColor: "neutral600",
                            children: [
                              "Time elapsed: ",
                              formatElapsedTime(elapsedTime),
                            ],
                          }),
                        }),
                        /* @__PURE__ */ jsx(Box, {
                          marginBottom: 4,
                          children: /* @__PURE__ */ jsx(Box, {
                            background: "neutral200",
                            hasRadius: true,
                            style: {
                              width: "100%",
                              height: "300px",
                              animation:
                                "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                            },
                          }),
                        }),
                        /* @__PURE__ */ jsxs(Box, {
                          children: [
                            /* @__PURE__ */ jsx(Box, {
                              background: "neutral200",
                              hasRadius: true,
                              style: {
                                width: "100%",
                                height: "20px",
                                marginBottom: "8px",
                                animation:
                                  "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                              },
                            }),
                            /* @__PURE__ */ jsx(Box, {
                              background: "neutral200",
                              hasRadius: true,
                              style: {
                                width: "80%",
                                height: "20px",
                                animation:
                                  "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                              },
                            }),
                          ],
                        }),
                      ],
                    }),
                  modalState === "success" &&
                    /* @__PURE__ */ jsxs(Box, {
                      children: [
                        /* @__PURE__ */ jsx(Box, {
                          marginBottom: 4,
                          children: /* @__PURE__ */ jsx("img", {
                            src: resultImage || "/placeholder.svg",
                            alt: "Modified image",
                            style: {
                              width: "100%",
                              height: "auto",
                              borderRadius: "4px",
                            },
                          }),
                        }),
                        /* @__PURE__ */ jsxs(Box, {
                          children: [
                            /* @__PURE__ */ jsxs(Typography, {
                              variant: "sigma",
                              fontWeight: "bold",
                              marginBottom: 2,
                              children: [
                                /* @__PURE__ */ jsx(Language, {
                                  id: "yourPrompt",
                                }),
                                ":",
                              ],
                            }),
                            /* @__PURE__ */ jsx(Typography, {
                              variant: "omega",
                              children: resultReasoning,
                            }),
                          ],
                        }),
                      ],
                    }),
                  modalState === "error" &&
                    /* @__PURE__ */ jsx(Box, {
                      children: /* @__PURE__ */ jsx(Typography, {
                        variant: "omega",
                        textColor: "danger600",
                        children: errorMessage,
                      }),
                    }),
                ],
              }),
              /* @__PURE__ */ jsxs(Modal.Footer, {
                children: [
                  modalState === "success" &&
                    /* @__PURE__ */ jsxs(Fragment, {
                      children: [
                        /* @__PURE__ */ jsx(Button, {
                          variant: "tertiary",
                          onClick: handleCloseModal,
                          children: "Dismiss",
                        }),
                        /* @__PURE__ */ jsx(Button, {
                          onClick: handleSaveImage,
                          children: /* @__PURE__ */ jsx(Language, {
                            id: "save",
                          }),
                        }),
                      ],
                    }),
                  modalState === "error" &&
                    /* @__PURE__ */ jsx(Button, {
                      onClick: handleCloseModal,
                      children: "Close",
                    }),
                ],
              }),
            ],
          }),
        }),
      /* @__PURE__ */ jsx("style", {
        children: `
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `,
      }),
    ],
  });
});
const toSentenceCase = (str) => {
  if (!str) return "";
  const withSpaces = str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};
const Language = ({ id }) => {
  const { formatMessage } = useIntl();
  return formatMessage({
    id: getTranslation(`imagiterate.imagiterateField.${id}`),
    defaultMessage: toSentenceCase(id),
  });
};
export { Input };
//# sourceMappingURL=Input-Xi8lLHXD.mjs.map
