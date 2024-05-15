# FovusFullStackProject

### Prerequisites
- Download node.js and install npm.
- Install AWS CLI
- Install AWS CDK: run npm install -g aws-cdk.

  ### AWS configure
  - configure the aws as per your access and secret key and set the region (eg-> us-east-2)

  ### Project Setup
1. Clone the repository. 
   - git clone <repo_link>
2. Go to Root of the project(for downloding the dependencies i.e. node module run below commands):
   - in FovusFullStackProject directory
	- npm install
3. cd lambda/dynamoDBEventEC2Instance/
	- npm install
4. cd ../presignurl/
	- npm install
5. cd ../saveInputDataToDynamoDB/
	- npm install
6. Go to Script Directory and run the keypairCreation.bat  for key pair creation for EC2 instance to make sure that the keypair exists if not then it will create a new one:
   - cd ../../script/
   - .\keypairCreation.bat
8. Now go to root directory. (i.e. in FovusFullStackProject)
   - cd ..
9. cdk bootstrap
10. cdk deploy
11. Go to environment file of frontend application (my-upload-app/)
   	- cd my-upload-app 
   	- open .env file:
  		 1. copy the outputs and paste the value of dynamodb table, s3 bucket to the my-upload-app .env file
   	 	 2. copy the api endpoints and paste it into environment variable.
   			- REACT_APP_API_URL=<presign_APIEndpoint>
   			- REACT_APP_S3_BUCKET_NAME = <Bucket_Name>
   			- DYNAMODB_TABLE_NAME = <DynamoDB_Table_Name>
  			- REACT_APP_DYNAMODB_URL= <InputDataToDynamoDB_APIEndpoint>
12. Go to my-upload-app/ root directory where app.js is placed:
   1. cd ..\my-upload-app\
   2. npm start
13. upload input files for testing.

### Project Result
1. Creation of S3 bucket, dynamodb table, lambda function with API gateway and dynamodb event for one of the lambda(i.e. for EC2 instances), after creating S3 bucket the shell script will be uploaded to s3 bucket.
2. Uploaded input files from the UI would get uploaded to S3 bucket, a entry with the input text and input file path will get stored into dynamo db table.
3. Event would get triggered and will create EC2 instance, run the uploaded shell script and then terminate the EC2 instance(delay has been kept for 60sec to ensure that script runs properly).
4. Script will download the input file from s3 bucket, append the file with input text and rename the file with output_<input_filename>, upload the same to the S3 bucket and updating the dynamodb table with output file path.


### References:
1. https://docs.aws.amazon.com/cdk/latest/guide/home.html
2. https://docs.aws.amazon.com/lambda/latest/dg/welcome.html
3. https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html
4. https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html
