import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StreamViewType } from 'aws-cdk-lib/aws-dynamodb';

export class LambdaCreation extends Construct {
    public readonly presignLambda: lambda.Function;
    public readonly saveInputDataToDynamoDB: cdk.aws_lambda.Function;
    public readonly EC2Instances: cdk.aws_lambda.Function;
    public readonly dynamoTable: dynamodb.ITable;
  
    constructor(scope: Construct, id: string, bucketName: string) {
        super(scope, id);

    //Dynamodb creation:
    const dynamoDBInputTable2 = new dynamodb.Table(this, 'InputTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,  
      writeCapacity: 5, 
      stream: StreamViewType.NEW_AND_OLD_IMAGES 
    });

    const dynamodbTABLE_NAME = dynamoDBInputTable2.tableName;

    new cdk.CfnOutput(this, 'Dynamodb Table Name', {
      value: `${dynamodbTABLE_NAME}`,
      exportName: 'DynamodbTableName'
    });

    // IAM Role for Lambda
    const lambdaRole_presign = new iam.Role(this, 'LambdaExecutionRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
          //added for ec2 instance
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
        ],
      });
    
    
      // Lambda Function
      this.presignLambda = new lambda.Function(this, 'PresignUrlFunction', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('lambda/presignurl/'),
          handler: 'index.handler',
          environment: { 
            BUCKET_NAME: bucketName,
          },
          role: lambdaRole_presign,
        });

        // API Gateway
        const api = new apigateway.RestApi(this, 'PresignApi', {
          endpointTypes: [apigateway.EndpointType.REGIONAL]
        });
  
        const resource = api.root.addResource('presign');
        resource.addMethod('POST', new apigateway.LambdaIntegration(this.presignLambda), {
          authorizationType: apigateway.AuthorizationType.NONE, // Assuming no authorization for simplicity
          methodResponses: [{  // Method response for CORS
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
              'method.response.header.Access-Control-Allow-Headers': true,
              'method.response.header.Access-Control-Allow-Methods': true
            }
          }]
      });
  
      // Enable CORS on the POST method
      resource.addCorsPreflight({
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['*'],
      });
  
      // Output API endpoint
      new cdk.CfnOutput(this, '_PRESIGN_', {
        value: `${api.url}presign`,
        exportName: 'presign'
      });
  

      // IAM Role for Lambda dyanmodb
     const lambdaRole_dynamodb = new iam.Role(this, 'lambda2Role', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
        ],
      });

      // Lambda Function
      this.saveInputDataToDynamoDB = new lambda.Function(this, 'saveInputDataToDynamoDBFunction', {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('lambda/saveInputDataToDynamoDB/'),
        handler: 'index.handler',
        environment: { 
          BUCKET_NAME: bucketName,
          TABLE_NAME: dynamoDBInputTable2.tableName,

        },
        role: lambdaRole_dynamodb,
      });

      // API Gateway
      const apiDynamoDB = new apigateway.RestApi(this, 'apiDynamoDBTable', {
          endpointTypes: [apigateway.EndpointType.REGIONAL]
        });

      const resource1 = apiDynamoDB.root.addResource('InputDataToDynamoDB');
      resource1.addMethod('POST', new apigateway.LambdaIntegration(this.saveInputDataToDynamoDB), {
      authorizationType: apigateway.AuthorizationType.NONE,
      methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true
      },
      responseModels: {
        'application/json': apigateway.Model.EMPTY_MODEL
      }
      }]
      });

      resource1.addMethod('GET', new apigateway.LambdaIntegration(this.saveInputDataToDynamoDB), {
      authorizationType: apigateway.AuthorizationType.NONE,
      methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true
      }
      }]
      });

      // Enable CORS on the POST method
      resource1.addCorsPreflight({
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['*'],
      });

      // Output API endpoint
      new cdk.CfnOutput(this, 'InputDataToDynamoDB', {
        value: `${apiDynamoDB.url}InputDataToDynamoDB`,
        exportName: 'InputDataToDynamoDB'
      });

      // Create an IAM role for EC2 instance
      const ec2InstanceRole = new iam.Role(this, 'EC2InstanceRole', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaDynamoDBExecutionRole'),
        ],
      });
      
      // Create an instance profile and associate it with the ec2InstanceRole
      const ec2InstanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
        instanceProfileName: 'EC2InstanceProfile',
        roles: [ec2InstanceRole.roleName],
      });
 
      // IAM Role for Lambda
      const lambda3Role_EC2 = new iam.Role(this, 'Lambda3Role', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'),
        ],
      });
    
      // Grant the iam:PassRole permission to the lambda3Role
      lambda3Role_EC2.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [ec2InstanceRole.roleArn],
      })
      );
      
      lambda3Role_EC2.addToPolicy(new iam.PolicyStatement({
        resources: ['*'],
        actions: ['ec2:RunInstances', 'ec2:TerminateInstances', 'iam:PassRole'],
      }));
    
      lambda3Role_EC2.addToPolicy(new iam.PolicyStatement({
        actions: ['iam:CreateRole', 'iam:AttachRolePolicy'],
        resources: ['*'], // Restrict this in production environments
      }));
    
      // Permissions to create and manage IAM roles and instance profiles
      lambda3Role_EC2.addToPolicy(new iam.PolicyStatement({
      actions: [
        'iam:CreateRole',
        'iam:AttachRolePolicy',
        'iam:CreateInstanceProfile',
        'iam:AddRoleToInstanceProfile',
        'iam:GetInstanceProfile'
      ],
      resources: ['*'],
      }));
    
      // Lambda Function
      this.EC2Instances = new lambda.Function(this, 'EC2InstanceStream', {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('lambda/dynamoDBEventEC2Instance/'),
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(300),
        environment: {
          TABLE_NAME: dynamoDBInputTable2.tableName,    //added for testing
          EC2_INSTANCE_PROFILE_ARN: ec2InstanceProfile.attrArn, 
          BUCKET_NAME: bucketName,                      //added for testing
        },
        role: lambda3Role_EC2,
      });
  
      this.EC2Instances.addEventSource(new DynamoEventSource(dynamoDBInputTable2, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 5,
        bisectBatchOnError: true,
        retryAttempts: 2
      }));
      
    }
    }
    