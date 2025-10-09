import React, { useState, useEffect } from "react";
import { Widget } from "@strapi/admin/strapi-admin";
import { Input } from "./Input";

const ImagiterateWidget2 = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <Widget.Loading />;
  if (error) return <Widget.Error>{error}</Widget.Error>;
  if (!images || images.length === 0) return <Widget.NoData />;

  return (
    <Input
      images={images}
      placeholder="Provide a prompt and Imagiterate will use AI to edit the currently active image."
    />
  );
};

export default ImagiterateWidget2;
