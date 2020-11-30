const aws = require('aws-sdk');

/**
 * 
 * Describe ECS clusters.
 * 
 * @param {String} region
 * @param {String} ecsClusterName
 *
 * Return doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#describeClusters-property
 * @returns {Promise} object
 * 
 */
const describeClusters = async (region, ecsClusterName) => {
    const params = {
        clusters: [
            ecsClusterName
        ],
    };

    const ecs = new aws.ECS({region: region});
    return await ecs.describeClusters(params).promise();
};

/**
 * 
 * Describe ECS services.
 * 
 * @param {String} region
 * @param {String} ecsClusterName
 * @param {String} ecsServiceName
 *
 * Return doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#describeServices-property
 * @returns {Promise} object
 * 
 */
const describeServices = async (region, ecsClusterName, ecsServiceName) => {
    const params = {
        services: [
            ecsServiceName
        ],
        cluster: ecsClusterName
    };

    const ecs = new aws.ECS({region: region});
    return await ecs.describeServices(params).promise();
};

/**
 * 
 * Update ECS service.
 * 
 * @param {String} region
 * @param {String} ecsClusterName
 * @param {String} ecsServiceName
 * @param {BigInteger} desiredCount
 *
 * Return doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#updateService-property
 * @returns {Promise} object
 * 
 */
const updateService = async (region, ecsClusterName, ecsServiceName, desiredCount) => {
    const params = {
        cluster: ecsClusterName,
        service: ecsServiceName,
        desiredCount: desiredCount,
    };

    const ecs = new aws.ECS({region: region});
    return await ecs.updateService(params).promise();
};

module.exports = {describeClusters, describeServices, updateService}