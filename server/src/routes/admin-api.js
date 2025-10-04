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
];
