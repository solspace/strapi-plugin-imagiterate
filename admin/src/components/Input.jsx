"use client";

import * as React from "react";
import { useIntl } from "react-intl";
import { useField } from "@strapi/strapi/admin";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardSubtitle,
  Field,
  Flex,
  Textarea,
  Typography,
  Modal,
  Grid,
} from "@strapi/design-system";
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

  React.useEffect(() => {
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

      setResultImage(data.imageUrl);
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
          documentId: documentId,
          imageUrl: resultImage,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save image");
      }

      const savedImage = await res.json();
      console.log("[v0] Saved image:", savedImage);

      // Add new image to carousel and make it active
      const newImages = [...images, savedImage];
      setImages(newImages);
      setActiveImageIndex(newImages.length - 1);

      // Close modal and reset
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

  return (
    <Field.Root
      name={name}
      id={name}
      error={field.error}
      hint={hint}
      required={required}
    >
      <Flex direction="column" alignItems="stretch" gap={1}>
        <Card>
          <CardHeader>
            <Typography fontWeight="bold">
              {formatMessage({
                id: getTranslation("imagiterate.imagiterateField.label"),
                defaultMessage: "Imagiterate AIs",
              })}
            </Typography>
          </CardHeader>
          <CardSubtitle>
            <Typography>
              {formatMessage({
                id: getTranslation("imagiterate.imagiterateField.subtitle"),
                defaultMessage: "",
              })}
            </Typography>
          </CardSubtitle>

          <CardBody>
            <Grid.Root gap={4}>
              {/* Left column: Carousel */}
              <Grid.Item col={6} xs={12}>
                <Box>
                  <Typography
                    variant="sigma"
                    fontWeight="bold"
                    marginBottom={2}
                  >
                    Images
                  </Typography>
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
                        minHeight: "300px",
                      }}
                    >
                      <Typography variant="omega" textColor="neutral600">
                        No images available. Upload an image to get started.
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {/* Image display */}
                      <Box
                        background="neutral100"
                        hasRadius
                        style={{
                          position: "relative",
                          width: "100%",
                          paddingBottom: "75%",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={
                            images[activeImageIndex].url || "/placeholder.svg"
                          }
                          alt={
                            images[activeImageIndex].alternativeText ||
                            `Image ${activeImageIndex + 1}`
                          }
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </Box>

                      {/* Carousel controls */}
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        marginTop={2}
                      >
                        <Button
                          variant="tertiary"
                          size="S"
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev > 0 ? prev - 1 : images.length - 1,
                            )
                          }
                          disabled={isProcessing || images.length <= 1}
                        >
                          Previous
                        </Button>
                        <Typography variant="pi" textColor="neutral600">
                          {activeImageIndex + 1} / {images.length}
                        </Typography>
                        <Button
                          variant="tertiary"
                          size="S"
                          onClick={() =>
                            setActiveImageIndex((prev) =>
                              prev < images.length - 1 ? prev + 1 : 0,
                            )
                          }
                          disabled={isProcessing || images.length <= 1}
                        >
                          Next
                        </Button>
                      </Flex>
                    </Box>
                  )}
                </Box>
              </Grid.Item>

              {/* Right column: Prompt */}
              <Grid.Item col={6} xs={12}>
                <Box>
                  <Field.Label>Prompt</Field.Label>
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
                    placeholder={
                      placeholder ||
                      "Enter a prompt to modify the active image..."
                    }
                    onChange={handlePromptChange}
                  />
                  <Box marginTop={2}>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        !prompt.trim() || isProcessing || images.length === 0
                      }
                      loading={isProcessing}
                    >
                      Submit
                    </Button>
                  </Box>
                </Box>
              </Grid.Item>
            </Grid.Root>

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
                {modalState === "loading" && "Processing Image..."}
                {modalState === "success" && "Image Modified"}
                {modalState === "error" && "Error"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {modalState === "loading" && (
                <Box>
                  {/* Timer */}
                  <Flex justifyContent="center" marginBottom={4}>
                    <Typography variant="omega" textColor="neutral600">
                      Time elapsed: {formatElapsedTime(elapsedTime)}
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

                  {/* AI reasoning */}
                  <Box>
                    <Typography
                      variant="sigma"
                      fontWeight="bold"
                      marginBottom={2}
                    >
                      AI Reasoning
                    </Typography>
                    <Typography variant="omega">{resultReasoning}</Typography>
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
                  <Button onClick={handleSaveImage}>Save to Collection</Button>
                </>
              )}
              {modalState === "error" && (
                <Button onClick={handleCloseModal}>Close</Button>
              )}
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
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
