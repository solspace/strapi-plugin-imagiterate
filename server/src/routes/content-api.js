export default [
  {
    method: 'POST',
    path: '/iterate',
    handler: 'controller.iterate',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/upload',
    handler: 'controller.upload',
    config: {
      policies: [],
    },
  },
];
