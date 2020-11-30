const moment = require('moment');
const {getMetricData} = require('./lib/cloudwatch');
const {arbiter} = require('./lib/scaling-arbiter');
const {describeAutoScalingGroups, updateAutoScalingGroup} = require('./lib/autoscaling');
const {describeClusters, describeServices, updateService} = require('./lib/ecs');
const env = process.env.ENVIRONMENT === 'local' ? require('dotenv').config().parsed : require('./env');

/**
 *
 * Get CloudWatch metric data.
 * 
 * @returns {BigInteger}
 * @throws {Exception}
 * 
 */
const getCloudWatchMetricData = async () => {
    try {
        let cloudWatchMetricDataResult;
        const cloudWatchMetricResult = await getMetricData(env.AWS_REGION, env.ENVIRONMENT, env.CLOUD_WATCH_METRIC_NAME, env.CLOUD_WATCH_METRIC_LABEL, env.CLOUD_WATCH_METRIC_NAMESPACE, parseInt(env.CLOUD_WATCH_METRIC_PERIOD), env.CLOUD_WATCH_METRIC_STAT, env.CLOUD_WATCH_METRIC_UNIT);
        console.log(`CloudWatch metric result:\n ${JSON.stringify(cloudWatchMetricResult)}`);
        if (cloudWatchMetricResult.MetricDataResults.length > 0) {
            cloudWatchMetricDataResult = cloudWatchMetricResult.MetricDataResults[0].Values.length > 0 ? Math.max(...cloudWatchMetricResult.MetricDataResults[0].Values) : 0;  
            console.log(`CloudWatch metric data result: ${cloudWatchMetricDataResult}`);
            // If CloudWatch metric data result is 0.
            if (cloudWatchMetricDataResult === 0) {
                throw new Error(`CloudWatch metric data result is invalid!`);  
            }
            return cloudWatchMetricDataResult;
        } else {
            throw new Error(`CloudWatch metric result is not found!`); 
        }
    } catch (err) {
        throw err;
    } 
}

/**
 *
 * Get AutoScaling group desired capacity.
 * 
 * @returns {BigInteger}
 * @throws {Exception}
 * 
 */
const getAutoScalingGroupDesiredCapacity = async () => {
    try {
        let autoScalingGroupDesiredCapacity;
        const autoScalingGroupResult = await describeAutoScalingGroups(env.AWS_REGION, env.AUTO_SCALING_API_VERSION, env.AUTO_SCALING_GROUP_NAME);
        console.log(`AutoScaling group result:\n ${JSON.stringify(autoScalingGroupResult)}`);
        if (autoScalingGroupResult.AutoScalingGroups.length > 0) {
             // Get AutoScaling group desired capacity.
            autoScalingGroupDesiredCapacity = autoScalingGroupResult.AutoScalingGroups[0].DesiredCapacity;
            console.log(`AutoScaling group desired capacity: ${autoScalingGroupDesiredCapacity}`);
            return autoScalingGroupDesiredCapacity;
        } else {
            throw new Error(`AutoScaling group result is not found!`);
        }
    } catch (err) {
        throw err;
    }
}

/**
 *
 * Get ECS cluster register container instances count.
 * 
 * @returns {BigInteger}
 * @throws {Exception}
 * 
 */
const getECSClusterRegisteredContainerInstancesCount = async() => {
    try {
        let ecsClusterRegisteredContainerInstancesCount;
        const ecsClusterResult = await describeClusters(env.AWS_REGION, env.ECS_CLUSTER_NAME);
        console.log(`ECS cluster result:\n ${JSON.stringify(ecsClusterResult)}`);
        if (ecsClusterResult.clusters.length > 0) {
            // Get ECS cluster registered container instances count.
            ecsClusterRegisteredContainerInstancesCount = ecsClusterResult.clusters[0].registeredContainerInstancesCount;
            console.log(`ECS cluster registered container instances count: ${ecsClusterRegisteredContainerInstancesCount}`);
            return ecsClusterRegisteredContainerInstancesCount;
        } else {
            throw new Error(`ECS cluster result is not found!`);
        }
    } catch (err) {
        throw err;
    }
}

/**
 *
 * Get ECS service desired and running tasks count.
 * 
 * @returns {BigInteger}
 * @throws {Exception}
 * 
 */
const getECSServiceDesiredAndRunningTasksCount = async() => {
    try {
        let ecsServiceDesiredTasksCount, ecsServiceRunningTasksCount;
        const ecsServiceResult = await describeServices(env.AWS_REGION, env.ECS_CLUSTER_NAME, env.ECS_SERVICE_NAME);
        console.log(`ECS service result:\n ${JSON.stringify(ecsServiceResult)}`);
        if (ecsServiceResult.services.length > 0) {
            // Get ECS service desired tasks count.
            ecsServiceDesiredTasksCount = ecsServiceResult.services[0].desiredCount;
            ecsServiceRunningTasksCount = ecsServiceResult.services[0].runningCount;
            console.log(`ECS service desired tasks count: ${ecsServiceDesiredTasksCount}`);
            console.log(`ECS service running tasks count: ${ecsServiceRunningTasksCount}`);
            return {
                'ecsServiceDesiredTasksCount': ecsServiceDesiredTasksCount,
                'ecsServiceRunningTasksCount': ecsServiceRunningTasksCount
            };
        } else {
            throw new Error(`ECS service result is not found!`);
        }
    } catch (err) {
        throw err;
    }
}

/**
 * 
 * Scale up AutoScaling group desired capacity and ECS service desired tasks count.
 * 
 * First scale up AutoScaling group with recommended AutoScaling group desired capacity and wait for instances to be registered with ECS cluster.
 * Once instances are ready, scale up ECS service with recommended ECS service desired tasks count.
 * 
 * @param {BigInteger} autoScalingGroupDesiredCapacity 
 * @param {BigInteger} ecsClusterRegisteredContainerInstancesCount 
 * @param {BigInteger} ecsServiceDesiredTasksCount 
 * @param {BigInteger} recommendedAutoScalingGroupDesiredCapacity 
 * @param {BigInteger} recommendedECSServiceDesiredTasksCount 
 * @returns {Object}
 * @throws {Exception}
 * 
 */
const scaleUp = async (autoScalingGroupDesiredCapacity, ecsClusterRegisteredContainerInstancesCount, ecsServiceDesiredTasksCount, recommendedAutoScalingGroupDesiredCapacity, recommendedECSServiceDesiredTasksCount) => {
    try {
        let autoScalingGroupUpdate = false, ecsServiceUpdate = false;
        // If AutoScaling group desired capacity is less than recommended AutoScaling group desired capacity, update AutoScaling group with recommendedAutoScalingGroupDesiredCapacity.
        if (autoScalingGroupDesiredCapacity < recommendedAutoScalingGroupDesiredCapacity) {
            console.log(`Commencing scaling up of AutoScaling group ${env.AUTO_SCALING_GROUP_NAME} at ${moment().format()}`);
            const updateAutoScalingGroupResult = await updateAutoScalingGroup(env.AWS_REGION, env.AUTO_SCALING_API_VERSION, env.AUTO_SCALING_GROUP_NAME, recommendedAutoScalingGroupDesiredCapacity);
            console.log(`Update AutoScaling group result:\n' ${JSON.stringify(updateAutoScalingGroupResult)}`);
            console.log(`AutoScaling group ${env.AUTO_SCALING_GROUP_NAME} is now updated with desired capacity ${recommendedAutoScalingGroupDesiredCapacity}`);
            autoScalingGroupUpdate = true;
        }
        /* 
            If ECS cluster registered container instances count is same as recommended AutoScaling group desired capacity and 
            ECS service desired tasks count is less than recommended ECS service desired tasks count, 
            update ECS service with recommendedECSServiceDesiredTasksCount.
        */
        if (ecsClusterRegisteredContainerInstancesCount === recommendedAutoScalingGroupDesiredCapacity && ecsServiceDesiredTasksCount < recommendedECSServiceDesiredTasksCount) {
            console.log(`Commencing scaling up of ECS service ${env.ECS_SERVICE_NAME} at ${moment().format()}`);
            const updateECSServiceResult = await updateService(env.AWS_REGION, env.ECS_CLUSTER_NAME, env.ECS_SERVICE_NAME, recommendedECSServiceDesiredTasksCount);
            console.log(`Update ECS service result:\n ${JSON.stringify(updateECSServiceResult)}`);
            console.log(`ECS service ${env.ECS_SERVICE_NAME} is now updated with desired tasks count ${recommendedECSServiceDesiredTasksCount}`);
            ecsServiceUpdate = true;
        }
        return {
            'statusCode': 200,
            'autoScalingGroupUpdate' : autoScalingGroupUpdate,
            'ecsServiceUpdate': ecsServiceUpdate,
            'body': {
                'messages': [
                    `AutoScaling group desired capacity: ${autoScalingGroupDesiredCapacity}`,
                    `AutoScaling group recommended desired capacity: ${recommendedAutoScalingGroupDesiredCapacity}`,
                    `ECS service desired tasks count: ${ecsServiceDesiredTasksCount}`,
                    `ECS service recommended desired tasks count: ${recommendedECSServiceDesiredTasksCount}`,
                ],
            }
        }
    } catch (err) {
        throw err;
    } 
};

/**
 * 
 * Scale down AutoScaling group desired capacity and ECS service desired tasks count.
 * 
 * First scale down ECS service with recommended ECS service desired tasks count and wait for tasks to stop.
 * Once ECS service running tasks count is same as recommended ECS service desired tasks count, scale down AutoScaling group with recommended AutoScaling group desired capacity. 
 * 
 * @param {BigInteger} autoScalingGroupDesiredCapacity 
 * @param {BigInteger} ecsServiceRunningTasksCount 
 * @param {BigInteger} ecsServiceDesiredTasksCount 
 * @param {BigInteger} recommendedAutoScalingGroupDesiredCapacity 
 * @param {BigInteger} recommendedECSServiceDesiredTasksCount 
 * @returns {Object}
 * @throws {Exception}
 * 
 */
const scaleDown = async (autoScalingGroupDesiredCapacity, ecsServiceRunningTasksCount, ecsServiceDesiredTasksCount, recommendedAutoScalingGroupDesiredCapacity, recommendedECSServiceDesiredTasksCount) => {
    try {
        let autoScalingGroupUpdate = false, ecsServiceUpdate = false;
        // If ECS service desired tasks count is more than recommended ECS service desired tasks count, update ECS service with recommendedECSServiceDesiredTasksCount.
        if (ecsServiceDesiredTasksCount > recommendedECSServiceDesiredTasksCount) {
            console.log(`Commencing scaling down of AutoScaling group ${env.AUTO_SCALING_GROUP_NAME} at ${moment().format()}`);
            const updateECSServiceResult = await updateService(env.AWS_REGION, env.ECS_CLUSTER_NAME, env.ECS_SERVICE_NAME, recommendedECSServiceDesiredTasksCount);
            console.log(`Update ECS service result:\n ${JSON.stringify(updateECSServiceResult)}`);
            console.log(`ECS service ${env.ECS_SERVICE_NAME} is now updated with desired tasks count ${recommendedECSServiceDesiredTasksCount}`);
            ecsServiceUpdate = true;
        }
        /* 
            If ECS service running tasks count is same as recommended ECS service desired tasks count and
            AutoScaling group desired capacity is more than recommended AutoScaling group desired capacity,
            update AutoScaling group with recommendedAutoScalingGroupDesiredCapacity.
        */
        if (ecsServiceRunningTasksCount === recommendedECSServiceDesiredTasksCount && autoScalingGroupDesiredCapacity > recommendedAutoScalingGroupDesiredCapacity) {
            console.log(`Commencing scaling down of AutoScaling group ${env.AUTO_SCALING_GROUP_NAME} at ${moment().format()}`); 
            const updateAutoScalingGroupResult = await updateAutoScalingGroup(env.AWS_REGION, env.AUTO_SCALING_API_VERSION, env.AUTO_SCALING_GROUP_NAME, recommendedAutoScalingGroupDesiredCapacity);
            console.log(`Update AutoScaling group result:\n ${JSON.stringify(updateAutoScalingGroupResult)}`);
            console.log(`AutoScaling group ${env.AUTO_SCALING_GROUP_NAME} is now updated with desired capacity ${recommendedAutoScalingGroupDesiredCapacity}`);
            autoScalingGroupUpdate = true;            
        }
        return {
            'statusCode': 200,
            'autoScalingGroupUpdate' : autoScalingGroupUpdate,
            'ecsServiceUpdate': ecsServiceUpdate,
            'body': {
                'messages': [
                    `AutoScaling group desired capacity: ${autoScalingGroupDesiredCapacity}`,
                    `AutoScaling group recommended desired capacity: ${recommendedAutoScalingGroupDesiredCapacity}`,
                    `ECS service desired tasks count: ${ecsServiceDesiredTasksCount}`,
                    `ECS service recommended desired tasks count: ${recommendedECSServiceDesiredTasksCount}`,
                ],
            }
        }
    } catch (err) {
        throw err;
    } 
};

/**
 * 
 * Main lambda handler.
 * 
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object
 * 
 */
exports.lambdaHandler = async (event, context) => {
    console.log(`Commencing execution of ${env.AWS_LAMBDA_FUNCTION_NAME} in ${env.AWS_REGION} at ${moment().format()}`);
    console.log(`Environment variables:\n ${JSON.stringify(env)}`);
    let response;
    try {

        // Get CloudWatch metric data.
        const cloudWatchMetricDataResult = await getCloudWatchMetricData();

        // Get AutoScaling group desired capacity.
        const autoScalingGroupDesiredCapacity = await getAutoScalingGroupDesiredCapacity();
        
        // Get ECS cluster result.
        const ecsClusterRegisteredContainerInstancesCount = await getECSClusterRegisteredContainerInstancesCount();
        
        // Get ECS service result.
        const {ecsServiceDesiredTasksCount, ecsServiceRunningTasksCount} = await getECSServiceDesiredAndRunningTasksCount();
        
        // Get recommended AutoScaling group desired recommended and ECS service desired tasks.
        let {recommendedAutoScalingGroupDesiredCapacity, recommendedECSServiceDesiredTasksCount} = arbiter(cloudWatchMetricDataResult, parseInt(env.NUMBER_OF_USERS_TO_HANDLE), parseInt(env.NUMBER_OF_SERVICE_TASKS_PER_SERVER));
        console.log(`Recommended AutoScaling group desired capacity: ${recommendedAutoScalingGroupDesiredCapacity}`);
        console.log(`Recommended ECS service desired tasks count: ${recommendedECSServiceDesiredTasksCount}`);
        // If recommended AutoScaling group desired capacity is less than AutoScaling group minimum capacity.
        if (recommendedAutoScalingGroupDesiredCapacity < parseInt(env.MINIMUM_AUTO_SCALING_GROUP_CAPACITY)) {
            recommendedAutoScalingGroupDesiredCapacity = parseInt(env.MINIMUM_AUTO_SCALING_GROUP_CAPACITY);
            console.log(`Enforced Recommended AutoScaling group desired capacity: ${recommendedAutoScalingGroupDesiredCapacity}`);
        }
        // If recommended AutoScaling group desired capacity is more than AutoScaling group maximum capacity.
        if (recommendedAutoScalingGroupDesiredCapacity > parseInt(env.MAXIMUM_AUTO_SCALING_GROUP_CAPACITY)) {
            recommendedAutoScalingGroupDesiredCapacity = parseInt(env.MAXIMUM_AUTO_SCALING_GROUP_CAPACITY);
            console.log(`Enforced Recommended AutoScaling group desired capacity: ${recommendedAutoScalingGroupDesiredCapacity}`);
        }
        // If recommended ECS service desired tasks count is less than minimum ECS service tasks count.
        if (recommendedECSServiceDesiredTasksCount < parseInt(env.MINIMUM_ECS_SERVICE_TASKS_COUNT)) {
            recommendedECSServiceDesiredTasksCount = parseInt(env.MINIMUM_ECS_SERVICE_TASKS_COUNT);
            console.log(`Enforced Recommended ECS service desired tasks count: ${recommendedECSServiceDesiredTasksCount}`);
        }
        // If recommended ECS service desired tasks count is more than maximum ECS service tasks count.
        if (recommendedECSServiceDesiredTasksCount > parseInt(env.MAXIMUM_ECS_SERVICE_TASKS_COUNT)) {
            recommendedECSServiceDesiredTasksCount = parseInt(env.MAXIMUM_ECS_SERVICE_TASKS_COUNT);
            console.log(`Enforced Recommended ECS service desired tasks count: ${recommendedECSServiceDesiredTasksCount}`);
        }

        // Determining scalingReferee.
        let scalingReferee;
        if (recommendedAutoScalingGroupDesiredCapacity > autoScalingGroupDesiredCapacity || recommendedECSServiceDesiredTasksCount > ecsServiceDesiredTasksCount) {
            scalingReferee = 'SCALE_UP';
        } else if (recommendedAutoScalingGroupDesiredCapacity < autoScalingGroupDesiredCapacity || recommendedECSServiceDesiredTasksCount < ecsServiceDesiredTasksCount) {
            scalingReferee = 'SCALE_DOWN';
        } else {
            scalingReferee = 'NO_CHANGE';
        }
        console.log(`Scaling referee: ${scalingReferee}`);
        
        // If scalingReferee is NO_CHANGE.
        if (scalingReferee === 'NO_CHANGE') {
            throw new Error(`Scaling is not required!`);
        }
        
        // If scalingReferee is SCALE_UP.
        if (scalingReferee === 'SCALE_UP') {
            // If scale up is permitted.
            if (env.SCALE_UP) {
                response = scaleUp(autoScalingGroupDesiredCapacity, ecsClusterRegisteredContainerInstancesCount, ecsServiceDesiredTasksCount, recommendedAutoScalingGroupDesiredCapacity, recommendedECSServiceDesiredTasksCount);
            } else {
                throw new Error(`Scale up is not permitted!`);
            }
        } 
        
        // If scalingReferee is SCALE_DOWN.
        if (scalingReferee === 'SCALE_DOWN') {
            // If scale down is permitted.
            if (env.SCALE_UP) {
                response = scaleDown(autoScalingGroupDesiredCapacity, ecsServiceRunningTasksCount, ecsServiceDesiredTasksCount, recommendedAutoScalingGroupDesiredCapacity, recommendedECSServiceDesiredTasksCount);
            } else {
                throw new Error(`Scale down is not permitted!`);
            }
        } 
    } catch (err) {
        console.log(err.message);
        return err;
    }

    return response;
};
