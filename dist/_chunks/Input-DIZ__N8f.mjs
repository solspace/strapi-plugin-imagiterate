import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { forwardRef, useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import { useField } from "@strapi/strapi/admin";
import { Field, Flex, Card, CardHeader, Typography, CardSubtitle, CardBody, Grid, Box, CarouselInput, CarouselSlide, CarouselImage, Textarea, Button, Modal } from "@strapi/design-system";
import { useParams } from "react-router-dom";
import { P as PLUGIN_ID } from "./index-CiVSIF-_.mjs";
const getTranslation = (id) => `${PLUGIN_ID}.${id}`;
const Input = forwardRef((props, ref) => {
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
    images: externalImages = []
  } = props;
  const field = useField(name);
  const { formatMessage } = useIntl();
  const { id: documentId } = useParams();
  const [images, setImages] = useState(externalImages);
  const [embeddedFromWidget, setEmbeddedFromWidget] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState("closed");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [resultImage, setResultImage] = useState("");
  const [resultImageUrl, setResultImageUrl] = useState("");
  const [alternativeText, setAlternativeText] = useState("");
  const [resultReasoning, setResultReasoning] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const timerRef = useRef(null);
  useEffect(() => {
    setEmbeddedFromWidget(externalImages && externalImages.length > 0);
    const fetchDocument = async () => {
      try {
        const res = await fetch(
          `/imagiterate/get-document?documentId=${documentId}`,
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
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
  useEffect(() => {
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          documentId,
          url: activeImage.url
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to process image");
      }
      const data = await res.json();
      console.log("[v0] Iterate response:", data);
      setAlternativeText(data.alternativeText);
      setResultImageUrl(data.url);
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
    setIsSaving(true);
    try {
      const res = await fetch("/imagiterate/save-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentId,
          alternativeText,
          url: resultImageUrl
        })
      });
      if (!res.ok) {
        throw new Error("Failed to save image");
      }
      const savedImage = await res.json();
      console.log("[v0] Saved image:", savedImage);
      const newImages = [
        ...images,
        { alternativeText, url: resultImageUrl, base64Image: resultImage }
      ];
      setImages(newImages);
      setActiveImageIndex(newImages.length - 1);
      setModalState("successfulSave");
      setPrompt("");
      setAlternativeText("");
      setResultImage("");
      setResultReasoning("");
    } catch (err) {
      console.error("[v0] Error saving image:", err);
      setErrorMessage("Failed to save image.");
      setModalState("error");
    } finally {
      setIsSaving(false);
    }
  };
  const handleCloseModal = () => {
    setModalState("closed");
    setPrompt("");
    setAlternativeText("");
    setResultImage("");
    setResultReasoning("");
    setErrorMessage("");
  };
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  return /* @__PURE__ */ jsxs(
    Field.Root,
    {
      name,
      id: name,
      error: field.error,
      hint,
      required,
      children: [
        /* @__PURE__ */ jsx(Flex, { direction: "column", alignItems: "stretch", gap: 1, children: /* @__PURE__ */ jsxs(Card, { children: [
          !embeddedFromWidget && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(Typography, { fontWeight: "bold", children: /* @__PURE__ */ jsx(Language, { id: "imagiterateAi" }) }) }),
            /* @__PURE__ */ jsx(CardSubtitle, { padding: 4, children: /* @__PURE__ */ jsx(Typography, { children: /* @__PURE__ */ jsx(Language, { id: "subtitle" }) }) })
          ] }),
          /* @__PURE__ */ jsxs(CardBody, { children: [
            /* @__PURE__ */ jsxs(
              Grid.Root,
              {
                gap: embeddedFromWidget ? 0 : 4,
                style: { alignItems: "stretch", minHeight: "300px" },
                children: [
                  /* @__PURE__ */ jsx(Grid.Item, { col: 7, xs: 12, children: /* @__PURE__ */ jsxs(
                    Box,
                    {
                      style: {
                        width: "100%",
                        height: "100%",
                        maxHeight: "500px"
                      },
                      children: [
                        images.length === 0 ? /* @__PURE__ */ jsx(
                          Box,
                          {
                            background: "neutral100",
                            padding: 8,
                            hasRadius: true,
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: "300px"
                            },
                            children: /* @__PURE__ */ jsx(Typography, { variant: "omega", textColor: "neutral600", children: /* @__PURE__ */ jsx(Language, { id: "noImagesAvailable" }) })
                          }
                        ) : /* @__PURE__ */ jsx(
                          CarouselInput,
                          {
                            label: `Active image (${activeImageIndex + 1}/${images.length})`,
                            selectedSlide: activeImageIndex,
                            previousLabel: "Previous slide",
                            nextLabel: "Next slide",
                            onNext: () => setActiveImageIndex(
                              (prev) => prev < images.length - 1 ? prev + 1 : 0
                            ),
                            onPrevious: () => setActiveImageIndex(
                              (prev) => prev > 0 ? prev - 1 : images.length - 1
                            ),
                            style: {
                              width: "90%",
                              position: "relative",
                              zIndex: 1
                            },
                            children: images.map((img, index) => /* @__PURE__ */ jsx(
                              CarouselSlide,
                              {
                                label: `${index + 1} of ${images.length} slides`,
                                style: {
                                  height: "100%",
                                  position: "relative",
                                  overflow: "hidden"
                                },
                                children: /* @__PURE__ */ jsx(
                                  Box,
                                  {
                                    style: {
                                      cursor: "pointer",
                                      position: "relative",
                                      zIndex: 0
                                    },
                                    onClick: () => setEnlargedImage(img.url),
                                    children: /* @__PURE__ */ jsx(
                                      CarouselImage,
                                      {
                                        src: img.base64Image || img.url || "/placeholder.svg",
                                        alt: img.alternativeText || `Image ${index + 1}`,
                                        style: {
                                          width: "99%",
                                          height: "auto",
                                          display: "block"
                                        }
                                      }
                                    )
                                  }
                                )
                              },
                              index
                            ))
                          }
                        ),
                        embeddedFromWidget && /* @__PURE__ */ jsxs(Field.Root, { name: "file", children: [
                          /* @__PURE__ */ jsx(Field.Label, { children: /* @__PURE__ */ jsx(Language, { id: "uploadAnImage" }) }),
                          /* @__PURE__ */ jsx(
                            Field.Input,
                            {
                              type: "file",
                              onChange: (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setUploadedFile(file);
                                }
                              },
                              disabled: disabled || isProcessing
                            }
                          ),
                          /* @__PURE__ */ jsx(Field.Hint, { children: /* @__PURE__ */ jsx(Language, { id: "fileUploadHint" }) }),
                          /* @__PURE__ */ jsx(Field.Error, {})
                        ] })
                      ]
                    }
                  ) }),
                  /* @__PURE__ */ jsx(Grid.Item, { col: 5, xs: 12, children: /* @__PURE__ */ jsxs(
                    Box,
                    {
                      style: { width: "100%", height: "100%", maxHeight: "500px" },
                      children: [
                        /* @__PURE__ */ jsx(Field.Label, { children: /* @__PURE__ */ jsx(Language, { id: "prompt" }) }),
                        /* @__PURE__ */ jsx(
                          Textarea,
                          {
                            ref,
                            "aria-label": formatMessage({
                              id: getTranslation("imagiterate.input.aria-label"),
                              defaultMessage: "Imagiterate input"
                            }),
                            name: "prompt",
                            value: prompt,
                            disabled: disabled || isProcessing || images.length === 0,
                            required,
                            placeholder: placeholder || /* @__PURE__ */ jsx(Language, { id: "enterAPrompt" }),
                            onChange: handlePromptChange,
                            rows: embeddedFromWidget ? 7 : 10,
                            style: { width: "100%" }
                          }
                        ),
                        /* @__PURE__ */ jsx(Box, { marginTop: 2, children: /* @__PURE__ */ jsx(
                          Button,
                          {
                            onClick: handleSubmit,
                            disabled: !prompt.trim() || isProcessing || images.length === 0,
                            loading: isProcessing,
                            children: /* @__PURE__ */ jsx(Language, { id: "submit" })
                          }
                        ) })
                      ]
                    }
                  ) })
                ]
              }
            ),
            /* @__PURE__ */ jsx(Field.Hint, {}),
            /* @__PURE__ */ jsx(Field.Error, {})
          ] })
        ] }) }),
        modalState !== "closed" && /* @__PURE__ */ jsx(Modal.Root, { open: true, onOpenChange: handleCloseModal, children: /* @__PURE__ */ jsxs(Modal.Content, { children: [
          /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsxs(Modal.Title, { children: [
            modalState === "loading" && /* @__PURE__ */ jsx(Language, { id: "processingImage" }),
            modalState === "success" && /* @__PURE__ */ jsx(Language, { id: "aiModifiedImage" }),
            modalState === "successfulSave" && /* @__PURE__ */ jsx(Language, { id: "aiModifiedImage" }),
            modalState === "error" && /* @__PURE__ */ jsx(Language, { id: "error" })
          ] }) }),
          /* @__PURE__ */ jsxs(Modal.Body, { children: [
            modalState === "loading" && /* @__PURE__ */ jsxs(Box, { children: [
              /* @__PURE__ */ jsx(Flex, { justifyContent: "center", marginBottom: 4, children: /* @__PURE__ */ jsxs(Typography, { variant: "omega", textColor: "neutral600", children: [
                /* @__PURE__ */ jsx(Language, { id: "generating" }),
                ":",
                " ",
                formatElapsedTime(elapsedTime)
              ] }) }),
              /* @__PURE__ */ jsx(Box, { marginBottom: 4, children: /* @__PURE__ */ jsx(
                Box,
                {
                  background: "neutral200",
                  hasRadius: true,
                  style: {
                    width: "100%",
                    height: "300px",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  }
                }
              ) }),
              /* @__PURE__ */ jsxs(Box, { children: [
                /* @__PURE__ */ jsx(
                  Box,
                  {
                    background: "neutral200",
                    hasRadius: true,
                    style: {
                      width: "100%",
                      height: "20px",
                      marginBottom: "8px",
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    }
                  }
                ),
                /* @__PURE__ */ jsx(
                  Box,
                  {
                    background: "neutral200",
                    hasRadius: true,
                    style: {
                      width: "80%",
                      height: "20px",
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    }
                  }
                )
              ] })
            ] }),
            modalState === "success" && /* @__PURE__ */ jsxs(Box, { children: [
              /* @__PURE__ */ jsx(Box, { marginBottom: 4, children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: resultImage || "/placeholder.svg",
                  alt: "Modified image",
                  style: {
                    width: "100%",
                    height: "auto",
                    borderRadius: "4px"
                  }
                }
              ) }),
              /* @__PURE__ */ jsx(Box, { marginBottom: 4, children: /* @__PURE__ */ jsxs(Field.Root, { name: "alternativeText", children: [
                /* @__PURE__ */ jsx(Field.Label, { children: /* @__PURE__ */ jsx(Language, { id: "alternativeText" }) }),
                /* @__PURE__ */ jsx(
                  Field.Input,
                  {
                    type: "text",
                    placeholder: "Enter alternative text",
                    value: alternativeText,
                    onChange: (e) => setAlternativeText(e.target.value)
                  }
                ),
                /* @__PURE__ */ jsx(Field.Hint, { children: /* @__PURE__ */ jsx(Language, { id: "describeImageForAccessibility" }) })
              ] }) }),
              /* @__PURE__ */ jsxs(Box, { children: [
                /* @__PURE__ */ jsxs(
                  Typography,
                  {
                    variant: "sigma",
                    fontWeight: "bold",
                    marginBottom: 2,
                    children: [
                      /* @__PURE__ */ jsx(Language, { id: "yourPrompt" }),
                      ":",
                      " "
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(Typography, { variant: "omega", children: prompt })
              ] })
            ] }),
            isSaving && /* @__PURE__ */ jsx(Flex, { justifyContent: "center", alignItems: "center", marginTop: 4, children: /* @__PURE__ */ jsxs(Typography, { variant: "omega", textColor: "neutral600", children: [
              /* @__PURE__ */ jsx(Language, { id: "savingImage" }),
              "…"
            ] }) }),
            modalState === "successfulSave" && /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Box, { marginBottom: 4, children: /* @__PURE__ */ jsx(Typography, { variant: "delta", marginBottom: 2, children: /* @__PURE__ */ jsx(Language, { id: "imageSaved" }) }) }) }),
            modalState === "error" && /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Typography, { variant: "omega", textColor: "danger600", children: errorMessage }) })
          ] }),
          /* @__PURE__ */ jsxs(Modal.Footer, { children: [
            modalState === "success" && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Button, { variant: "tertiary", onClick: handleCloseModal, children: "Dismiss" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: handleSaveImage,
                  loading: isSaving,
                  disabled: isSaving,
                  children: isSaving ? /* @__PURE__ */ jsx(Language, { id: "saving" }) : /* @__PURE__ */ jsx(Language, { id: "save" })
                }
              )
            ] }),
            modalState === "successfulSave" && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", onClick: handleCloseModal, children: "Dismiss" }) }),
            modalState === "error" && /* @__PURE__ */ jsx(Button, { onClick: handleCloseModal, children: /* @__PURE__ */ jsx(Language, { id: "close" }) })
          ] })
        ] }) }),
        enlargedImage && /* @__PURE__ */ jsx(Modal.Root, { open: true, onOpenChange: () => setEnlargedImage(null), children: /* @__PURE__ */ jsxs(Modal.Content, { children: [
          /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsx(Modal.Title, { children: /* @__PURE__ */ jsx(Language, { id: "enlargedImage" }) }) }),
          /* @__PURE__ */ jsx(Modal.Body, { children: /* @__PURE__ */ jsx(Box, { style: { width: "100%", textAlign: "center" }, children: /* @__PURE__ */ jsx(
            "img",
            {
              src: enlargedImage,
              alt: "Enlarged",
              style: {
                maxWidth: "100%",
                maxHeight: "80vh",
                borderRadius: "4px"
              }
            }
          ) }) }),
          /* @__PURE__ */ jsx(Modal.Footer, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", onClick: () => setEnlargedImage(null), children: /* @__PURE__ */ jsx(Language, { id: "close" }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("style", { children: `
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      ` })
      ]
    }
  );
});
const toSentenceCase = (str) => {
  if (!str) return "";
  const withSpaces = str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};
const Language = ({ id }) => {
  const { formatMessage } = useIntl();
  return formatMessage({
    id: getTranslation(`imagiterate.imagiterateField.${id}`),
    defaultMessage: toSentenceCase(id)
  });
};
export {
  Input
};
//# sourceMappingURL=Input-DIZ__N8f.mjs.map
