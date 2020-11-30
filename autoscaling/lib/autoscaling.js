const aws = require('aws-sdk');

/**
 * 
 * Describe AutoScaling groups.
 * 
 * @param {String} region
 * @param {String} apiVersion
 * @param {String} autoScalingGroupName
 *
 * Return doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/AutoScaling.html#describeAutoScalingGroups-property
 * @returns {Promise} object
 * 
 */
const describeAutoScalingGroups = async (region, apiVersion, autoScalingGroupName) => {
    const params = {
        AutoScalingGroupNames: [
            autoScalingGroupName
        ]
    };

    const autoscaling = new aws.AutoScaling({region: region, apiVersion: apiVersion});
    return await autoscaling.describeAutoScalingGroups(params).promise();
};

/**
 * 
 * Update AutoScaling group.
 * 
 * @param {String} region
 * @param {String} apiVersion
 * @param {String} autoScalingGroupName
 * @param {BigInteger} desiredCapacity
 *
 * Return doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/AutoScaling.html#updateAutoScalingGroup-property
 * @returns {Promise} object
 * 
 */
const updateAutoScalingGroup = async (region, apiVersion, autoScalingGroupName, desiredCapacity) => {
    const params = {
        AutoScalingGroupName: autoScalingGroupName,
        DesiredCapacity: desiredCapacity
    };

    const autoscaling = new aws.AutoScaling({region: region, apiVersion: apiVersion});
    return await autoscaling.updateAutoScalingGroup(params).promise();
};

module.exports = {describeAutoScalingGroups, updateAutoScalingGroup}