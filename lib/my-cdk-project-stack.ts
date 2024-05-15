  import * as cdk from 'aws-cdk-lib';
  import { Construct } from 'constructs';
  import { S3Bucket } from './S3Bucket';
  import { LambdaCreation } from './LambdaCreation';
import { uploadFile } from '../script/uploadShellScript';


  export class MycdkProjectStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

    try {
    const stackName = this.stackName;
    const accountId = process.env.CDK_DEFAULT_ACCOUNT || 'S3Bucket';
    console.log(`Stack DEployment: ${stackName} in account: ${accountId}`);
    const bucketName = `${stackName.toLowerCase()}-${accountId}`;
    console.log(`Bucket name: ${bucketName}`);

    new S3Bucket(this, 'S3Setup', bucketName);
    const lambdacreations = new LambdaCreation(this, 'LambdaSetup', bucketName);
    uploadFile(bucketName);

      }catch (error) {
        console.error(`Error setting up the Fovus stack: ${error}`);
      }
      }
  }


