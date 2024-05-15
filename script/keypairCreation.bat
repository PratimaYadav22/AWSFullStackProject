@echo off
set KEY_PAIR=ec2vm

aws ec2 describe-key-pairs --key-name "%KEY_PAIR%" --query "KeyPairs[*].KeyName" --output text > temp.txt
findstr /M "%KEY_PAIR%" temp.txt
if errorlevel 1 (
    echo Key pair not found, creating one...
    aws ec2 create-key-pair --key-name "%KEY_PAIR%" --query "KeyMaterial" --output text > "%KEY_PAIR%.pem"
    echo Key pair created and saved as %KEY_PAIR%.pem
) else (
    echo Key pair '%KEY_PAIR%' already exists.
)
del temp.txt
