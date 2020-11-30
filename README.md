# AutoScaling Lambda function

This project contains source code and supporting files for a serverless application that you can deploy with the SAM CLI. It includes the following files and folders.

- autoscaling - Code for the application's Lambda function that reads the CloudWatch metric and update AutoScaling group with recommended desired capacity and ECS cluster's service with recommended desired tasks count.
- events - Invocation events that you can use to invoke the function.
- autoscaling/tests - Unit tests for the application code.
- template.yaml - A template that defines the application's AWS resources.

The application uses several AWS resources, including Lambda functions and an API Gateway API. These resources are defined in the `template.yaml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.

If you prefer to use an integrated development environment (IDE) to build and test your application, you can use the AWS Toolkit.  
The AWS Toolkit is an open source plug-in for popular IDEs that uses the SAM CLI to build and deploy serverless applications on AWS. The AWS Toolkit also adds a simplified step-through debugging experience for Lambda function code. See the following links to get started.

* [PyCharm](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [IntelliJ](https://docs.aws.amazon.com/toolkit-for-jetbrains/latest/userguide/welcome.html)
* [VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html)
* [Visual Studio](https://docs.aws.amazon.com/toolkit-for-visual-studio/latest/user-guide/welcome.html)

## Environment variables

Create .env with following environment variables for local setup.

* **AWS_LAMBDA_FUNCTION_NAME**: Lambda function name.
* **AWS_REGION**: AWS region.
* **ENVIRONMENT**: local/dev/prod - Environment type used to fetch CloudWatch metric data. Set local to load local .env file.
* **SCALE_UP**: 1 - 1=enabled, 0=disabled. If scale up is disabled, this application won't perform scale up.
* **SCALE_DOWN**: 1 - 1=enabled, 0=disabled. If scale down is disabled, this application won't perform scale down.
* **CLOUD_WATCH_METRIC_NAME**: CloudWatch metric name.
* **CLOUD_WATCH_METRIC_LABEL**: CloudWatch metric label.
* **CLOUD_WATCH_METRIC_NAMESPACE**: CloudWatch metric namespace.
* **CLOUD_WATCH_METRIC_PERIOD**: 300/600 - CloudWatch metric period in seconds to fetch the metric data points, also used in to calculate start time.
* **CLOUD_WATCH_METRIC_STAT**: CloudWatch metric stat value.
* **CLOUD_WATCH_METRIC_UNIT**: CloudWatch metric unit value.
* **AUTO_SCALING_API_VERSION**: 2011-01-01 - AutoScaling API version.
* **AUTO_SCALING_GROUP_NAME**: AutoScaling group name.
* **ECS_CLUSTER_NAME**: ECS cluster name.
* **ECS_SERVICE_NAME**: ECS service name.
* **NUMBER_OF_USERS_TO_HANDLE**: 100/150/250 - Number of users to handle to calculate AutoScaling group desired capacity and ECS service desired tasks count.
* **MINIMUM_AUTO_SCALING_GROUP_CAPACITY**: Minimum AutoScaling group capacity. Application won't scale down AutoScaling group desired capacity than this specified value.
* **MAXIMUM_AUTO_SCALING_GROUP_CAPACITY**: Maximum AutoScaling group capacity. Application won't scale up AutoScaling group desired capacity than this specified value.
* **MINIMUM_ECS_SERVICE_TASKS_COUNT**: Minimum ECS service tasks count. Application won't scale down ECS service desired tasks count than this specified value.
* **MAXIMUM_ECS_SERVICE_TASKS_COUNT**: Maximum ECS service tasks count. Application won't scale up ECS service desired tasks count than this specified value.
* **NUMBER_OF_SERVICE_TASKS_PER_SERVER**: Number of service tasks count per server. Number of service tasks count/containers per server.

## Deploy this application

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 10](https://nodejs.org/en/), including the NPM package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build

sam deploy --parameter-overrides 'Environment=<<Environment>> ScaleUp=<<ScaleUp>> ScaleDown=<<ScaleDown>> CloudWatchMetricName=<<CloudWatchMetricName>> CloudWatchMetricLabel=<<CloudWatchMetricLabel>> CloudWatchMetricNamespace=<<CloudWatchMetricNamespace>> CloudWatchMetricPeriod=<<CloudWatchMetricPeriod>> CloudWatchMetricStat=<<CloudWatchMetricStat>> CloudWatchMetricUnit=<<CloudWatchMetricUnit>> AutoScalingApiVersion=<<AutoScalingApiVersionAutoScalingApiVersion>> AutoScalingGroupName=<<AutoScalingGroupName>> EcsClusterName=<<EcsClusterName>> EcsServiceName=<<EcsServiceName>> NumberOfUsersToHandle=<<NumberOfUsersToHandle>> MinimumAutoScalingGroupCapacity=<<MinimumAutoScalingGroupCapacity>> MaximumAutoScalingGroupCapacity=<<MaximumAutoScalingGroupCapacity>> MinimumEcsServiceTasksCount=<<MinimumEcsServiceTasksCount>> MaximumEcsServiceTasksCount=<<MaximumEcsServiceTasksCount>> NumberOfServiceTasksPerServer=<<NumberOfServiceTasksPerServer>>'
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of configurations provided in samconfig.toml:

* **Stack Name**: AutoscalingStack - The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
* **AWS Region**: ap-southeast-2 - The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: true - If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: CAPABILITY_IAM - Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modified IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
* **Save arguments to samconfig.toml**: true - If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

This will successfully create/update AWS CloudFormation stack with resources specified in template.yaml.

## Use the SAM CLI to build and test locally

Build your application with the `sam build` command.

```bash
autoscaling$ sam build
```

The SAM CLI installs dependencies defined in `autoscaling/package.json`, creates a deployment package, and saves it in the `.aws-sam/build` folder.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

To Run functions locally setup AWS toolkit for VS Code. VS Code provides run locally and debug locally options on top of Lambda function handler or invoke it with the `sam local invoke` command.

```bash
autoscaling$ sam local invoke AutoscaleFunction --event events/event.json --parameter-overrides 'Environment=<<Environment>> ScaleUp=<<ScaleUp>> ScaleDown=<<ScaleDown>> CloudWatchMetricName=<<CloudWatchMetricName>> CloudWatchMetricLabel=<<CloudWatchMetricLabel>> CloudWatchMetricNamespace=<<CloudWatchMetricNamespace>> CloudWatchMetricPeriod=<<CloudWatchMetricPeriod>> CloudWatchMetricStat=<<CloudWatchMetricStat>> CloudWatchMetricUnit=<<CloudWatchMetricUnit>> AutoScalingApiVersion=<<AutoScalingApiVersionAutoScalingApiVersion>> AutoScalingGroupName=<<AutoScalingGroupName>> EcsClusterName=<<EcsClusterName>> EcsServiceName=<<EcsServiceName>> NumberOfUsersToHandle=<<NumberOfUsersToHandle>> MinimumAutoScalingGroupCapacity=<<MinimumAutoScalingGroupCapacity>> MaximumAutoScalingGroupCapacity=<<MaximumAutoScalingGroupCapacity>> MinimumEcsServiceTasksCount=<<MinimumEcsServiceTasksCount>> MaximumEcsServiceTasksCount=<<MaximumEcsServiceTasksCount>> NumberOfServiceTasksPerServer=<<NumberOfServiceTasksPerServer>>'
```

## Add a resource to your application
The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in [the SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

## Fetch, tail, and filter Lambda function logs

To simplify troubleshooting, SAM CLI has a command called `sam logs`. `sam logs` lets you fetch logs generated by your deployed Lambda function from the command line. In addition to printing the logs on the terminal, this command has several nifty features to help you quickly find the bug.

`NOTE`: This command works for all AWS Lambda functions; not just the ones you deploy using SAM.

```bash
autoscaling$ sam logs -n AutoscaleFunction --stack-name AutoscalingStack --tail
```

You can find more information and examples about filtering Lambda function logs in the [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html).

## Unit tests

Tests are defined in the `autoscaling/tests` folder in this project. Use NPM to install the [Mocha test framework](https://mochajs.org/) and run unit tests.

```bash
autoscaling$ cd autoscaling
autoscaling$ npm install
autoscaling$ npm run test
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name AutoscalingStack
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)

Other resources:
* [AWS Lambda limits](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
* [AWS Lambda with other services](https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html)
* [AWS Serverless Application Model](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#awsserverlessfunction)
* [AWS Serverless Application Globals Section](https://github.com/awslabs/serverless-application-model/blob/master/docs/globals.rst)
* [AWS API References](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS.html)
* [AWS SAM CLI Command Reference](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
* [AWS SAM Template Metadata Section Properties](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-template-publishing-applications-metadata-properties.html)
* [Schedule AWS Lambda Functions Using CloudWatch Events](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/RunLambdaSchedule.html)
* [AWS CloudFormation Lambda Resource Type Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_Lambda.html)
* [AWS Cloudformation User Guide](https://github.com/awsdocs/aws-cloudformation-user-guide/tree/master/doc_source)
* [CloudFormation Resources Generated By SAM](https://github.com/awslabs/serverless-application-model/blob/develop/docs/internals/generated_resources.rst#schedule)
* [Serverless Examples](https://github.com/serverless/examples)
