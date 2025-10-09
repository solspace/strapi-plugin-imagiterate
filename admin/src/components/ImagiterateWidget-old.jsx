import React, { useState, useEffect } from "react";
import { Widget } from "@strapi/admin/strapi-admin";
import { useIntl } from "react-intl";
import { getTranslation } from "../utils/getTranslation";
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

const ImagiterateWidget = () => {
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    // Fetch your data here
    const fetchData = async () => {
      const res = await fetch(`/imagiterate/get-images`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const images = await res.json();
      console.log("[v0] Document images:", images);

      if (images.error) {
        setError("No images were found");
      } else {
        setImages(images);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  if (loading) return <Widget.Loading />;
  if (error) return <Widget.Error>{error}</Widget.Error>;
  if (!images || images.length === 0) return <Widget.NoData />;

  return (
    <Flex direction="column" alignItems="stretch" gap={1}>
      <Card>
        <CardBody>
          <Grid.Root
            gap={4}
            style={{ alignItems: "stretch", minHeight: "300px" }}
          >
            {/* Left column: Carousel */}
            <Grid.Item col={7} xs={12}>
              <Box
                style={{
                  width: "100%",
                }}
              >
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
                    width: "100%",
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
                        }}
                        onClick={() => setEnlargedImage(img.url)}
                      >
                        <CarouselImage
                          src={img.base64Image || img.url || "/placeholder.svg"}
                          alt={img.alternativeText || `Image ${index + 1}`}
                          style={{
                            width: "99%",
                            height: "auto",
                            display: "block",
                          }}
                        />
                      </Box>
                    </CarouselSlide>
                  ))}
                </CarouselInput>
              </Box>
            </Grid.Item>

            {/* Right column: Prompt */}
            <Grid.Item col={5} xs={12}>
              <Box
                style={{ width: "100%", height: "100%", maxHeight: "500px" }}
              >
                <Field.Label>
                  <Language id="prompt" />
                </Field.Label>
                <Textarea
                  name="prompt"
                  value={prompt}
                  disabled={disabled || isProcessing || images.length === 0}
                  placeholder={<Language id="enterAPrompt" />}
                  onChange={handlePromptChange}
                  rows={10}
                  style={{ width: "100%" }}
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
            </Grid.Item>
          </Grid.Root>
        </CardBody>
      </Card>
    </Flex>
  );
};

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
    id: getTranslation(`imagiterate.imagiterateWidget.${id}`),
    defaultMessage: toSentenceCase(id),
  });
};

export default ImagiterateWidget;
