export default [
  {
    method: "GET",
    path: "/get-document",
    handler: "controller.getDocument",
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/get-images",
    handler: "controller.getImages",
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: "POST",
    path: "/admin-iterate",
    handler: "controller.adminIterate",
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: "POST",
    path: "/save-image",
    handler: "controller.saveImage",
    config: {
      auth: false,
      policies: [],
    },
  },
];
