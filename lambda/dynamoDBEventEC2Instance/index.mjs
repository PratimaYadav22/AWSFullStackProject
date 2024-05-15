import { EC2Client, RunInstancesCommand, TerminateInstancesCommand } from "@aws-sdk/client-ec2";
import { IAMClient } from "@aws-sdk/client-iam";

const ec2Client = new EC2Client({ region: process.env.AWS_REGION });
const iamClient = new IAMClient({ region: process.env.AWS_REGION });
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const ec2InstanceRoleArn = process.env.EC2_INSTANCE_PROFILE_ARN;
const dynamodb_table_name = process.env.TABLE_NAME;
const s3_BUCKET_NAME = process.env.BUCKET_NAME;
const AWSregion = process.env.AWS_REGION;

console.log("ec2InstanceRoleArn: ",ec2InstanceRoleArn);

export const handler = async (event) => {
  try {
    const recordId = event.Records[0].dynamodb.Keys.id.S; // Extracting the ID of the newly inserted record
    const instanceId = await launchNewEC2Instance(recordId);
    // Launch a new EC2 instance
   console.log(`EC2 instance record id for shell script: ${recordId}`);
    console.log(`EC2 Instance launched with ID: ${instanceId}`);

    // Wait for the script to execute
    await delay(60000); 

    // Terminate the EC2 instance
    await terminateEC2Instance(instanceId);
    console.log(`EC2 Instance terminated with ID: ${instanceId}`);
  } catch (error) {
    console.error("Error in handling EC2 instances:", error);
    throw error;
  }
};

async function launchNewEC2Instance(recordId) {
  
  const userDataScript = `#!/bin/bash
  # Download the script from S3 (make sure the instance has the right IAM permissions)
  sudo su
  su ec2-user
  aws s3 cp s3://${s3_BUCKET_NAME}/script.sh /home/ec2-user/script.sh
  # Make the script executable
  chmod +x /home/ec2-user/script.sh
  # Execute the script
  /home/ec2-user/script.sh ${recordId} ${dynamodb_table_name} ${s3_BUCKET_NAME} ${AWSregion}`;

  const runCommand = new RunInstancesCommand({
    ImageId: 'ami-09b90e09742640522', 
    InstanceType: 't2.micro', 
    KeyName: 'ec2vm', 
    UserData: Buffer.from(userDataScript).toString('base64'),
    MinCount: 1,
    MaxCount: 1,
    IamInstanceProfile: {
      Arn: ec2InstanceRoleArn, 
    },
  });

  const runResponse = await ec2Client.send(runCommand);
  return runResponse.Instances[0].InstanceId;
}

async function terminateEC2Instance(instanceId) {
  const terminateCommand = new TerminateInstancesCommand({
    InstanceIds: [instanceId],
  });
  await ec2Client.send(terminateCommand);
}