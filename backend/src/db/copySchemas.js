const fs = require('fs-extra');

const copySchemas = async () => {
  try {
    await fs.copy('./src/db/schemas', './dist/db/schemas');
    console.log('Schemas copied successfully.');
  } catch (err) {
    console.error('Error copying schemas:', err);
  }
};

copySchemas();
