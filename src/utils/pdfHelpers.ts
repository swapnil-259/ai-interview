import mammoth from "mammoth";

export async function fileToGenerativePart(file: any) {
  if (file.mimetype === "application/pdf") {
    return {
      inlineData: {
        data: file.buffer.toString("base64"),
        mimeType: file.mimetype,
      },
    };
  } else if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const { value: text } = await mammoth.extractRawText({ buffer: file.buffer });
    return {
      inlineData: {
        data: Buffer.from(text).toString("base64"),
        mimeType: "text/plain",
      },
    };
  } else {
    throw new Error("Unsupported file type");
  }
}
