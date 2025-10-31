import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { forwardRef, useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import { useField, useStrapiApp } from "@strapi/strapi/admin";
import { Field, Flex, Card, CardHeader, Typography, CardSubtitle, CardBody, Box, Button, CarouselInput, CarouselSlide, CarouselImage, Textarea, Modal } from "@strapi/design-system";
import { useParams } from "react-router-dom";
import { P as PLUGIN_ID } from "./index-DDNPiFe0.mjs";
import { Wand2, Eye } from "lucide-react";
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
  const components = useStrapiApp(
    "ImagiterateInput",
    (state) => state.components
  );
  const MediaLibraryDialog = components && components["media-library"];
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
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [savedAssetId, setSavedAssetId] = useState(null);
  const [savedAssetUrl, setSavedAssetUrl] = useState("");
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
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
      const saved = Array.isArray(savedImage) ? savedImage[0] : savedImage;
      const uploadedUrl = saved?.url || resultImageUrl;
      const uploadedId = saved?.id || null;
      const newImages = [
        ...images,
        {
          id: uploadedId,
          alternativeText,
          url: uploadedUrl,
          base64Image: resultImage
        }
      ];
      setImages(newImages);
      setActiveImageIndex(newImages.length - 1);
      setModalState("successfulSave");
      setPrompt("");
      setAlternativeText("");
      setResultImage("");
      setResultReasoning("");
      setSavedAssetId(uploadedId);
      setSavedAssetUrl(uploadedUrl || "");
    } catch (err) {
      console.error("[v0] Error saving image:", err);
      setErrorMessage("Failed to save image.");
      setModalState("error");
    } finally {
      setIsSaving(false);
    }
  };
  const openMediaLibrary = () => setIsMediaLibraryOpen(true);
  const closeMediaLibrary = () => setIsMediaLibraryOpen(false);
  const handleSelectAssets = (assets) => {
    if (!assets || assets.length === 0) {
      setIsMediaLibraryOpen(false);
      return;
    }
    const nextImages = [...images];
    assets.forEach((a) => {
      const url = a.url || a?.formats?.medium?.url || a?.formats?.small?.url || a?.formats?.thumbnail?.url;
      if (url) {
        nextImages.unshift({
          id: a.id,
          alternativeText: a.alternativeText || a.name || "",
          url
        });
      }
    });
    setImages(nextImages);
    setActiveImageIndex(0);
    setIsMediaLibraryOpen(false);
  };
  const handleCloseModal = () => {
    setModalState("closed");
    setPrompt("");
    setAlternativeText("");
    setResultImage("");
    setResultReasoning("");
    setErrorMessage("");
    setGeneratedPrompt("");
  };
  const handleGenerateImage = async () => {
    if (!generatePrompt.trim()) return;
    setIsGenerating(true);
    setModalState("loading");
    setElapsedTime(0);
    try {
      const res = await fetch("/imagiterate/admin-iterate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: generatePrompt
          // No url = generation mode
        })
      });
      const result = await res.json();
      if (result.error) {
        throw new Error(result.error.message || "Failed to generate image");
      }
      setAlternativeText(result.alternativeText);
      setResultImageUrl(result.url);
      setResultImage(result.base64Image);
      setResultReasoning(result.reasoning);
      setGeneratedPrompt(generatePrompt);
      setModalState("success");
      setGeneratePrompt("");
      setShowGenerateModal(false);
    } catch (err) {
      console.error("Error generating image:", err);
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
      setModalState("error");
    } finally {
      setIsGenerating(false);
    }
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
        /* @__PURE__ */ jsx(Flex, { direction: "column", alignItems: "stretch", gap: 1, children: /* @__PURE__ */ jsxs(Card, { style: { border: "none", boxShadow: "none" }, children: [
          !embeddedFromWidget && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(Typography, { fontWeight: "bold", children: /* @__PURE__ */ jsx(Language, { id: "imagiterateAi" }) }) }),
            /* @__PURE__ */ jsx(CardSubtitle, { padding: 4, children: /* @__PURE__ */ jsx(Typography, { children: /* @__PURE__ */ jsx(Language, { id: "subtitle" }) }) })
          ] }),
          /* @__PURE__ */ jsxs(CardBody, { children: [
            /* @__PURE__ */ jsxs(Flex, { gap: 0, alignItems: "stretch", style: { width: "100%" }, children: [
              /* @__PURE__ */ jsxs(
                Box,
                {
                  style: {
                    width: 340,
                    minWidth: 340,
                    flex: "0 0 340px",
                    maxHeight: "300px",
                    marginRight: embeddedFromWidget ? 0 : 16
                  },
                  children: [
                    /* @__PURE__ */ jsxs(Flex, { gap: 2, marginBottom: 2, wrap: "wrap", children: [
                      /* @__PURE__ */ jsx(Button, { variant: "tertiary", onClick: openMediaLibrary, children: /* @__PURE__ */ jsx(Language, { id: "chooseFromLibrary" }) }),
                      /* @__PURE__ */ jsx(
                        Button,
                        {
                          variant: "tertiary",
                          onClick: () => setShowGenerateModal(true),
                          startIcon: isGenerating ? void 0 : /* @__PURE__ */ jsx(Wand2, { size: 16 }),
                          loading: isGenerating,
                          disabled: isProcessing || isGenerating,
                          children: isGenerating ? "Generating..." : "Generate Image"
                        }
                      )
                    ] }),
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
                          justifyContent: "center"
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
                          width: "93%",
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
                            children: /* @__PURE__ */ jsxs(
                              Box,
                              {
                                style: {
                                  cursor: "pointer",
                                  position: "relative",
                                  zIndex: 0,
                                  width: "170px",
                                  height: "160px"
                                },
                                onClick: () => setEnlargedImage(img.url),
                                onMouseEnter: () => setHoveredIndex(index),
                                onMouseLeave: () => setHoveredIndex(null),
                                children: [
                                  /* @__PURE__ */ jsx(
                                    CarouselImage,
                                    {
                                      src: img.base64Image || img.url || "/placeholder.svg",
                                      alt: img.alternativeText || `Image ${index + 1}`,
                                      style: {
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        display: "block",
                                        filter: hoveredIndex === index ? "brightness(0.7)" : "none"
                                      }
                                    }
                                  ),
                                  /* @__PURE__ */ jsx(
                                    Box,
                                    {
                                      style: {
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        pointerEvents: "none",
                                        color: "white",
                                        opacity: hoveredIndex === index ? 1 : 0,
                                        transition: "opacity 150ms ease"
                                      },
                                      children: /* @__PURE__ */ jsx(Eye, { size: 28, color: "#ffffff", "aria-hidden": true })
                                    }
                                  )
                                ]
                              }
                            )
                          },
                          index
                        ))
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Box,
                {
                  style: {
                    flex: 1,
                    minWidth: 0,
                    height: "100%",
                    maxHeight: "300px",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%"
                  },
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
                        rows: embeddedFromWidget ? 5 : 6,
                        style: { width: "100%", maxWidth: "100%", marginTop: 8 }
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
              )
            ] }),
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
              /* @__PURE__ */ jsx(Flex, { style: { justifyContent: "center" }, marginBottom: 4, children: /* @__PURE__ */ jsxs(Typography, { variant: "omega", textColor: "neutral600", children: [
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
                /* @__PURE__ */ jsx(Typography, { variant: "omega", children: generatedPrompt || prompt })
              ] })
            ] }),
            isSaving && /* @__PURE__ */ jsx(
              Flex,
              {
                style: { alignItems: "center", justifyContent: "center" },
                marginTop: 4,
                children: /* @__PURE__ */ jsxs(Typography, { variant: "omega", textColor: "neutral600", children: [
                  /* @__PURE__ */ jsx(Language, { id: "savingImage" }),
                  "…"
                ] })
              }
            ),
            modalState === "successfulSave" && /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsxs(Box, { marginBottom: 4, children: [
              /* @__PURE__ */ jsx(Typography, { variant: "delta", marginBottom: 2, children: /* @__PURE__ */ jsx(Language, { id: "imageSaved" }) }),
              /* @__PURE__ */ jsxs(Flex, { gap: 2, wrap: "wrap", marginTop: 3, marginBottom: 3, children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "tertiary",
                    onClick: () => {
                      const origin = window.location?.origin || "";
                      const url = `${origin}/admin/plugins/upload?sort=createdAt:DESC&page=1&pageSize=1`;
                      window.open(url, "_blank");
                    },
                    children: "Open Assets"
                  }
                ),
                savedAssetUrl ? /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "tertiary",
                    onClick: () => {
                      try {
                        const origin = window.location?.origin || "";
                        const fullUrl = savedAssetUrl.startsWith("http") ? savedAssetUrl : `${origin}${savedAssetUrl}`;
                        navigator.clipboard?.writeText(fullUrl);
                      } catch {
                      }
                    },
                    children: "Copy URL"
                  }
                ) : null
              ] })
            ] }) }),
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
          /* @__PURE__ */ jsx(Modal.Body, { children: /* @__PURE__ */ jsx(
            Box,
            {
              style: {
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: /* @__PURE__ */ jsx(
                "img",
                {
                  src: enlargedImage,
                  alt: "Enlarged",
                  style: {
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    borderRadius: "4px",
                    display: "block"
                  }
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx(Modal.Footer, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", onClick: () => setEnlargedImage(null), children: /* @__PURE__ */ jsx(Language, { id: "close" }) }) })
        ] }) }),
        isMediaLibraryOpen && MediaLibraryDialog && /* @__PURE__ */ jsx(
          MediaLibraryDialog,
          {
            onClose: closeMediaLibrary,
            onSelectAssets: handleSelectAssets,
            onAddAssets: handleSelectAssets,
            multiple: true,
            allowedTypes: ["images"]
          }
        ),
        showGenerateModal && /* @__PURE__ */ jsx(Modal.Root, { open: true, onOpenChange: () => setShowGenerateModal(false), children: /* @__PURE__ */ jsxs(Modal.Content, { children: [
          /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsx(Modal.Title, { children: "Generate Image with AI" }) }),
          /* @__PURE__ */ jsx(Modal.Body, { children: /* @__PURE__ */ jsxs(Box, { padding: 2, children: [
            /* @__PURE__ */ jsx(Typography, { variant: "pi", textColor: "neutral600", marginBottom: 3, children: "Describe the image you want to create" }),
            /* @__PURE__ */ jsx(
              Textarea,
              {
                placeholder: "A beautiful sunset over mountains with a lake reflection...",
                value: generatePrompt,
                onChange: (e) => setGeneratePrompt(e.target.value),
                rows: 4
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs(Modal.Footer, { children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => setShowGenerateModal(false),
                variant: "tertiary",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleGenerateImage,
                disabled: !generatePrompt.trim() || isGenerating,
                loading: isGenerating,
                children: "Generate"
              }
            )
          ] })
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
