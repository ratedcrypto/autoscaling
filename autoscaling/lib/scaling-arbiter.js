/**
 * 
 * Scaling arbiter.
 * 
 * @param {BigInteger} cloudwatchMetricDataResult
 * @param {BigInteger} numberOfUsersToHandle
 * @param {BigInteger} numberOfServiceTasksPerServer
 *
 * @returns {Object}
 * 
 */
const arbiter = (cloudwatchMetricDataResult, numberOfUsersToHandle, numberOfServiceTasksPerServer) => {
    $number = Math.ceil(cloudwatchMetricDataResult / numberOfUsersToHandle);
    return {
        'recommendedAutoScalingGroupDesiredCapacity' : $number,
        'recommendedECSServiceDesiredTasksCount' : $number * numberOfServiceTasksPerServer,
    }
};


module.exports = {arbiter}