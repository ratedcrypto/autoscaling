'use strict';

const app = require('../../app.js');
const env = require('dotenv').config().parsed;
const chai = require('chai');
const expect = chai.expect;
var event, context;

describe('Tests lambda handler', function () {
    it('verifies successful response', async () => {
        const result = await app.lambdaHandler(event, context)
        expect(result).to.be.an('object');
        expect(result.statusCode).to.equal(200);
    });
});
