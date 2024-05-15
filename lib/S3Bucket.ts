import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';


export class S3Bucket extends Construct {
    public readonly bucket: s3.Bucket;
    constructor(scope: Construct, id: string, bucketName: string) {
        super(scope, id);

    // S3 Bucket
    this.bucket = new s3.Bucket(this, bucketName, {
        bucketName: bucketName,
        publicReadAccess: false,
        cors: [{
          allowedHeaders: ["*"],
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.GET],
          allowedOrigins: ['*'],
        }]
      });

       // Output the S3 bucket name
       new cdk.CfnOutput(this, 'BucketName', {
        value: this.bucket.bucketName,
        description: 'The name of the S3 bucket'
    });
  
      // IAM User
      const user = new iam.User(this, 'MyAppUser');
  
       // Attach managed policies to user
       user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
       user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
       user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
       user.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'));
   
  
      const policy = new iam.PolicyStatement({
        actions: ['s3:*'],
        resources: [this.bucket.bucketArn],
      });
      user.addToPolicy(policy);
    }
}