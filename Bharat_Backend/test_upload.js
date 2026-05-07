import casesService from './src/modules/cases/cases.service.js';

const mockFile = {
  originalname: 'test.pdf',
  mimetype: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 mock content')
};

async function test() {
  try {
    const res = await casesService.processAndSaveCase(mockFile);
    console.log("Success:", res);
  } catch (err) {
    console.error("Caught error:", err);
  }
}
test();
