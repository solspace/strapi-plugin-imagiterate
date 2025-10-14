"use client";

import React, { forwardRef, useState, useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import { useField } from "@strapi/strapi/admin";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardSubtitle,
  CarouselInput,
  CarouselSlide,
  CarouselImage,
  Field,
  Flex,
  Textarea,
  Typography,
  Modal,
  Grid,
} from "@strapi/design-system";
import { useParams } from "react-router-dom";
import { getTranslation } from "../utils/getTranslation";
import { useStrapiApp } from "@strapi/strapi/admin";
import { Eye } from "lucide-react";

export const Input = forwardRef((props, ref) => {
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
    images: externalImages = [],
  } = props;

  const field = useField(name);
  const { formatMessage } = useIntl();
  const { id: documentId } = useParams();
  const components = useStrapiApp(
    "ImagiterateInput",
    (state) => state.components,
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

  const timerRef = useRef(null);

  useEffect(() => {
    // Set embedded from widget
    setEmbeddedFromWidget(externalImages && externalImages.length > 0);

    //	Initial fetch
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

        // Build images array: originalImage first, then images array
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
      }, 1000);
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

  const handleChange = (e) => {
    onChange({
      target: {
        name,
        type: attribute.type,
        value: e.currentTarget.value,
      },
    });
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return; // Don't submit empty prompts
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          alternativeText,
          url: resultImageUrl,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save image");
      }

      const savedImage = await res.json();
      console.log("[v0] Saved image:", savedImage);

      // savedImage can be an array (upload service returns array)
      const saved = Array.isArray(savedImage) ? savedImage[0] : savedImage;
      const uploadedUrl = saved?.url || resultImageUrl;
      const uploadedId = saved?.id || null;

      // Add new image to carousel and make it active
      const newImages = [
        ...images,
        {
          id: uploadedId,
          alternativeText,
          url: uploadedUrl,
          base64Image: resultImage,
        },
      ];
      setImages(newImages);
      setActiveImageIndex(newImages.length - 1);

      // Close modal and reset
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

  // Native Strapi Media Library flow (via helper-plugin)
  const openMediaLibrary = () => setIsMediaLibraryOpen(true);
  const closeMediaLibrary = () => setIsMediaLibraryOpen(false);
  const handleSelectAssets = (assets) => {
    if (!assets || assets.length === 0) {
      setIsMediaLibraryOpen(false);
      return;
    }
    const nextImages = [...images];
    assets.forEach((a) => {
      const url =
        a.url ||
        a?.formats?.medium?.url ||
        a?.formats?.small?.url ||
        a?.formats?.thumbnail?.url;
      if (url) {
        nextImages.unshift({
          id: a.id,
          alternativeText: a.alternativeText || a.name || "",
          url,
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
  };

  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
        <Card style={{ border: "none", boxShadow: "none" }}>
          {!embeddedFromWidget && (
            <>
              <CardHeader>
                <Typography fontWeight="bold">
                  <Language id="imagiterateAi" />
                </Typography>
              </CardHeader>
              <CardSubtitle padding={4}>
                <Typography>
                  <Language id="subtitle" />
                </Typography>
              </CardSubtitle>
            </>
          )}

          <CardBody>
            <Flex gap={0} alignItems="stretch" style={{ width: "100%" }}>
              {/* Left: fixed image column */}
              <Box
                style={{
                  width: 236,
                  minWidth: 236,
                  flex: "0 0 236px",
                  maxHeight: "300px",
                  marginRight: embeddedFromWidget ? 0 : 16,
                }}
              >
                <Flex gap={2} marginBottom={2} wrap="wrap">
                  <Button variant="tertiary" onClick={openMediaLibrary}>
                    <Language id="chooseFromLibrary" />
                  </Button>
                </Flex>
                {images.length === 0 ? (
                  <Box
                    background="neutral100"
                    padding={8}
                    hasRadius
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="omega" textColor="neutral600">
                      <Language id="noImagesAvailable" />
                    </Typography>
                  </Box>
                ) : (
                  <CarouselInput
                    label={`Active image (${activeImageIndex + 1}/${images.length})`}
                    selectedSlide={activeImageIndex}
                    previousLabel="Previous slide"
                    nextLabel="Next slide"
                    onNext={() =>
                      setActiveImageIndex((prev) =>
                        prev < images.length - 1 ? prev + 1 : 0,
                      )
                    }
                    onPrevious={() =>
                      setActiveImageIndex((prev) =>
                        prev > 0 ? prev - 1 : images.length - 1,
                      )
                    }
                    // remove actions to drop the edit/link/delete/publish bar
                    style={{
                      width: "90%",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {images.map((img, index) => (
                      <CarouselSlide
                        key={index}
                        label={`${index + 1} of ${images.length} slides`}
                        style={{
                          height: "100%",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          style={{
                            cursor: "pointer",
                            position: "relative",
                            zIndex: 0,
                            width: "170px",
                            height: "160px",
                          }}
                          onClick={() => setEnlargedImage(img.url)}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          <CarouselImage
                            src={
                              img.base64Image || img.url || "/placeholder.svg"
                            }
                            alt={img.alternativeText || `Image ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              display: "block",
                              filter:
                                hoveredIndex === index
                                  ? "brightness(0.7)"
                                  : "none",
                            }}
                          />
                          {/* Hover overlay with view icon */}
                          <Box
                            style={{
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
                              transition: "opacity 150ms ease",
                            }}
                          >
                            <Eye size={28} color="#ffffff" aria-hidden />
                          </Box>
                        </Box>
                      </CarouselSlide>
                    ))}
                  </CarouselInput>
                )}
              </Box>

              {/* Right: prompt takes remaining width */}
              <Box
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  maxHeight: "300px",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Field.Label>
                  <Language id="prompt" />
                </Field.Label>
                <Textarea
                  ref={ref}
                  aria-label={formatMessage({
                    id: getTranslation("imagiterate.input.aria-label"),
                    defaultMessage: "Imagiterate input",
                  })}
                  name="prompt"
                  value={prompt}
                  disabled={disabled || isProcessing || images.length === 0}
                  required={required}
                  placeholder={placeholder || <Language id="enterAPrompt" />}
                  onChange={handlePromptChange}
                  rows={embeddedFromWidget ? 7 : 10}
                  style={{ width: "100%", maxWidth: "100%", marginTop: 8 }}
                />
                <Box marginTop={2}>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !prompt.trim() || isProcessing || images.length === 0
                    }
                    loading={isProcessing}
                  >
                    <Language id="submit" />
                  </Button>
                </Box>
              </Box>
            </Flex>

            <Field.Hint />
            <Field.Error />
          </CardBody>
        </Card>
      </Flex>

      {modalState !== "closed" && (
        <Modal.Root open onOpenChange={handleCloseModal}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>
                {modalState === "loading" && <Language id="processingImage" />}
                {modalState === "success" && <Language id="aiModifiedImage" />}
                {modalState === "successfulSave" && (
                  <Language id="aiModifiedImage" />
                )}
                {modalState === "error" && <Language id="error" />}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {modalState === "loading" && (
                <Box>
                  {/* Timer */}
                  <Flex style={{ justifyContent: "center" }} marginBottom={4}>
                    <Typography variant="omega" textColor="neutral600">
                      <Language id="generating" />:{" "}
                      {formatElapsedTime(elapsedTime)}
                    </Typography>
                  </Flex>

                  {/* Skeleton loaders */}
                  <Box marginBottom={4}>
                    <Box
                      background="neutral200"
                      hasRadius
                      style={{
                        width: "100%",
                        height: "300px",
                        animation:
                          "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    />
                  </Box>
                  <Box>
                    <Box
                      background="neutral200"
                      hasRadius
                      style={{
                        width: "100%",
                        height: "20px",
                        marginBottom: "8px",
                        animation:
                          "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    />
                    <Box
                      background="neutral200"
                      hasRadius
                      style={{
                        width: "80%",
                        height: "20px",
                        animation:
                          "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    />
                  </Box>
                </Box>
              )}

              {modalState === "success" && (
                <Box>
                  {/* Result image */}
                  <Box marginBottom={4}>
                    <img
                      src={resultImage || "/placeholder.svg"}
                      alt="Modified image"
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "4px",
                      }}
                    />
                  </Box>

                  {/* Alternative text */}
                  <Box marginBottom={4}>
                    <Field.Root name="alternativeText">
                      <Field.Label>
                        <Language id="alternativeText" />
                      </Field.Label>
                      <Field.Input
                        type="text"
                        placeholder="Enter alternative text"
                        value={alternativeText}
                        onChange={(e) => setAlternativeText(e.target.value)}
                      />
                      <Field.Hint>
                        <Language id="describeImageForAccessibility" />
                      </Field.Hint>
                    </Field.Root>
                  </Box>

                  {/* AI reasoning */}
                  <Box>
                    <Typography
                      variant="sigma"
                      fontWeight="bold"
                      marginBottom={2}
                    >
                      <Language id="yourPrompt" />:{" "}
                    </Typography>
                    <Typography variant="omega">{prompt}</Typography>
                  </Box>
                </Box>
              )}

              {isSaving && (
                <Flex
                  style={{ alignItems: "center", justifyContent: "center" }}
                  marginTop={4}
                >
                  <Typography variant="omega" textColor="neutral600">
                    <Language id="savingImage" />…
                  </Typography>
                </Flex>
              )}

              {modalState === "successfulSave" && (
                <Box>
                  {/* Result image */}
                  <Box marginBottom={4}>
                    <Typography variant="delta" marginBottom={2}>
                      <Language id="imageSaved" />
                    </Typography>
                    <Flex gap={2} wrap="wrap" marginTop={3} marginBottom={3}>
                      <Button
                        variant="tertiary"
                        onClick={() => {
                          const origin = window.location?.origin || "";
                          const url = `${origin}/admin/plugins/upload?sort=createdAt:DESC&page=1&pageSize=1`;
                          window.open(url, "_blank");
                        }}
                      >
                        Open Assets
                      </Button>
                      {savedAssetUrl ? (
                        <Button
                          variant="tertiary"
                          onClick={() => {
                            try {
                              const origin = window.location?.origin || "";
                              const fullUrl = savedAssetUrl.startsWith("http")
                                ? savedAssetUrl
                                : `${origin}${savedAssetUrl}`;
                              navigator.clipboard?.writeText(fullUrl);
                            } catch {}
                          }}
                        >
                          Copy URL
                        </Button>
                      ) : null}
                    </Flex>
                  </Box>
                </Box>
              )}

              {modalState === "error" && (
                <Box>
                  <Typography variant="omega" textColor="danger600">
                    {errorMessage}
                  </Typography>
                </Box>
              )}
            </Modal.Body>
            <Modal.Footer>
              {modalState === "success" && (
                <>
                  <Button variant="tertiary" onClick={handleCloseModal}>
                    Dismiss
                  </Button>
                  <Button
                    onClick={handleSaveImage}
                    loading={isSaving}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Language id="saving" />
                    ) : (
                      <Language id="save" />
                    )}
                  </Button>
                </>
              )}
              {modalState === "successfulSave" && (
                <>
                  <Button variant="tertiary" onClick={handleCloseModal}>
                    Dismiss
                  </Button>
                </>
              )}
              {modalState === "error" && (
                <Button onClick={handleCloseModal}>
                  <Language id="close" />
                </Button>
              )}
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      )}

      {enlargedImage && (
        <Modal.Root open onOpenChange={() => setEnlargedImage(null)}>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>
                <Language id="enlargedImage" />
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Box
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={enlargedImage}
                  alt="Enlarged"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    borderRadius: "4px",
                    display: "block",
                  }}
                />
              </Box>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onClick={() => setEnlargedImage(null)}>
                <Language id="close" />
              </Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      )}

      {isMediaLibraryOpen && MediaLibraryDialog && (
        <MediaLibraryDialog
          onClose={closeMediaLibrary}
          onSelectAssets={handleSelectAssets}
          onAddAssets={handleSelectAssets}
          multiple
          allowedTypes={["images"]}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Field.Root>
  );
});

// Helper: convert camelCase or idString into sentence case
const toSentenceCase = (str) => {
  if (!str) return "";
  // Insert space before capital letters and lowercase the rest
  const withSpaces = str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

//	Language translating component
const Language = ({ id }) => {
  const { formatMessage } = useIntl();

  return formatMessage({
    id: getTranslation(`imagiterate.imagiterateField.${id}`),
    defaultMessage: toSentenceCase(id),
  });
};
