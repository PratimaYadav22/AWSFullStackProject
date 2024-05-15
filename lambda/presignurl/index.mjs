// Import AWS SDK for JavaScript v3 packages
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Create an S3 client object
const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  const body = JSON.parse(event.body);
  const { fileName, contentType } = body;

  // Create the parameters for the command
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  };

  // Create a command to get the object
  const command = new PutObjectCommand(params);

  try {
    // Create the pre-signed URL
    const preSignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // Expires in 1 hour

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" }, // CORS header
      body: JSON.stringify({ preSignedUrl }),
    };
  } catch (error) {
    console.error("Error creating pre-signed URL", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
