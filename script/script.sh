#!/bin/bash

# Assume the script is called with the ID as the first argument
ID=$1;
DYNAMO_TABLE=$2;
BUCKET_NAME=$3;
REGION=$4;

# Retrieve input data from DynamoDB based on the ID
INPUT_DATA=$(aws dynamodb get-item --table-name $DYNAMO_TABLE --key "{\"id\": {\"S\": \"$ID\"}}" --region $REGION)
echo $INPUT_DATA

# Extract only the filename from the full path
INPUT_FILE=$(echo $INPUT_DATA | jq -r '.Item.input_file_path.S' | awk -F'/' '{print $2}')
echo "INPUT_FILE:"
echo $INPUT_FILE
INPUT_TEXT=$(echo $INPUT_DATA | jq -r '.Item.input_text.S')
echo $INPUT_TEXT

# If INPUT_FILE or INPUT_TEXT are empty, handle the error appropriately
if [ -z "$INPUT_FILE" ] || [ -z "$INPUT_TEXT" ]; then
  echo "Error: Unable to retrieve data from DynamoDB."
  exit 1
fi

# Download the input file from S3 to the VM
aws s3 cp "s3://$BUCKET_NAME/$INPUT_FILE" "/tmp/$INPUT_FILE" --region $REGION

# Append the retrieved input text to the downloaded input file
echo " $INPUT_TEXT " >> "/tmp/$INPUT_FILE"

# Define the output file name
OUTPUT_FILE="output_$INPUT_FILE"

# Rename the modified file to the output file name
mv "/tmp/$INPUT_FILE" "/tmp/$OUTPUT_FILE"

# Upload the output file to S3
aws s3 cp "/tmp/$OUTPUT_FILE" "s3://$BUCKET_NAME/$OUTPUT_FILE" --region $REGION

# Update the DynamoDB table with the output file path
aws dynamodb update-item --table-name $DYNAMO_TABLE --key "{\"id\": {\"S\": \"$ID\"}}" --update-expression "SET output_file_path = :p" --expression-attribute-values "{\":p\": {\"S\": \"s3://$BUCKET_NAME/$OUTPUT_FILE\"}}" --region $REGION

# Clean up local files (if necessary)
rm "/tmp/$OUTPUT_FILE"
