import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import path from 'path';

// Access the AWS_REGION environment variable
const region = process.env.AWS_REGION || "us-east-2";

const s3Client = new S3Client({ region });

export async function uploadFile(bucketName: string) {
    const fileName = 'script.sh'; 
    const filePath = path.resolve(__dirname, fileName);
    try {
        const fileStream = createReadStream(filePath);

        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: fileStream,
        };

        const command = new PutObjectCommand(uploadParams);
        const response = await s3Client.send(command);
        console.log("Shell script upload to S3 was successful:", response);
    } catch (error) {
        console.error("Error while uploading file:", error);
    }
}