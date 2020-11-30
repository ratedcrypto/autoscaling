const aws = require('aws-sdk');
const moment = require('moment');

/**
 * 
 * Get CloudWatch metric data.
 * 
 * @param {String} region
 * @param {String} environment
 * @param {String} metricName
 * @param {String} metricLabel
 * @param {String} metricNamespace
 * @param {BigInteger} metricPeriod
 * @param {String} metricStat
 * @param {String} metricUnit
 *
 * Return doc: https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricData.html
 * @returns {Promise} object
 * 
 */
const getMetricData = async (region, environment, metricName, metricLabel, metricNamespace, metricPeriod, metricStat, metricUnit) => {
  const params = {
    StartTime: moment().unix() - metricPeriod, /* required */
    EndTime: moment().unix(), /* required */
    MetricDataQueries: [ /* required */
      {
        Id: 'm1', /* required */
        Label: metricLabel,
        MetricStat: {
          Metric: { /* required */
            Dimensions: [
              {
                Name: 'Environment', /* required */
                Value: environment /* required */
              },
            ],
            MetricName: metricName,
            Namespace: metricNamespace
          },
          Period: metricPeriod, /* required */
          Stat: metricStat, /* required */
          Unit: metricUnit
        },
        ReturnData: true,
      },
    ],
  };
  const cloudWatch = new aws.CloudWatch({region: region});
  return await cloudWatch.getMetricData(params).promise();
};

module.exports = {getMetricData}